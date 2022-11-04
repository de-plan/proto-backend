import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema } from 'mongoose';
import { FeatureCollection } from 'geojson';
import { Geometry } from 'geojson';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import 'dotenv/config';
import * as idl from '../../idl/proto.json';
import * as web3 from '@solana/web3.js';
import { GeoJSON } from 'geojson';
import { GeoJson, GeoJsonDocument } from '../models/geojson.schema';
import { Pdl, PdlDocument } from '../models/pdl.schema';
import { CreateGeojsonDto } from './dto/create-geojson.dto';
import { UpdateGeojsonDto } from './dto/update-geojson.dto';

interface GeoData {
  geojson: GeoJSON;
  mongo_id: Types.ObjectId;
}
@Injectable()
export class GeojsonService {
  constructor(
    @InjectModel(GeoJson.name) private geoJsonModel: Model<GeoJsonDocument>,
    @InjectModel(Pdl.name) private pdlModel: Model<PdlDocument>,
  ) {}

  async create(createGeojsonDto: CreateGeojsonDto) {
    try {
      // get the geometry from the geojson
      let geometry: Geometry;
      if (createGeojsonDto.geojson.type === 'FeatureCollection') {
        geometry = createGeojsonDto.geojson.features[0].geometry;
      } else if (createGeojsonDto.geojson.type === 'Feature') {
        geometry = createGeojsonDto.geojson.geometry;
      } else {
        geometry = createGeojsonDto.geojson;
      }
      // check if the sent geojson already exists in the database
      const databaseDuplicate = await this.geoJsonModel
        .findOne({
          geometry_string: JSON.stringify(geometry),
        })
        .populate('pdl', ['pdl', 'type'], this.pdlModel)
        .exec();
      if (databaseDuplicate) {
        return databaseDuplicate;
      }
      const secret = JSON.parse(process.env.SECRET_KEY);
      const secretKey = Uint8Array.from(secret);
      const keypair = web3.Keypair.fromSecretKey(secretKey);
      const connection = new Connection(clusterApiUrl('devnet'));
      const wallet = new anchor.Wallet(keypair);
      const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'recent',
      });
      // this line is important otherwise anchor will use localnet
      anchor.setProvider(provider);
      const program = new anchor.Program(
        // @ts-ignore
        idl,
        new web3.PublicKey(process.env.PROGRAM_ID),
      );
      const onChainDuplicates = await this.findExistingOnChain(
        program,
        createGeojsonDto.geojson,
      );
      if (onChainDuplicates.length) {
        throw new HttpException(
          'The provided GeoJSON already exists on-chain',
          HttpStatus.CONFLICT,
        );
      }
      // if the type in the dto is application then the geometry can overlap and intersect
      // otherwise it cannot
      if (createGeojsonDto.pdl_type !== 'application') {
        const overlap = await this.geoJsonModel.findOne({
          geometry: {
            $geoWithin: {
              $geometry: geometry,
            },
          },
        });
        if (overlap) {
          throw new HttpException(
            'Only application pdls can overlap',
            HttpStatus.CONFLICT,
          );
        }
        const intersect = await this.geoJsonModel.findOne({
          geometry: {
            $geoIntersects: {
              $geometry: geometry,
            },
          },
        });
        if (intersect) {
          throw new HttpException(
            'Only application pdls can intersect',
            HttpStatus.CONFLICT,
          );
        }
      }
      const newGeoJson = {
        geojson: createGeojsonDto.geojson,
        geometry_string: JSON.stringify(geometry),
        geometry: geometry,
      };
      const createdGeoJson = await this.geoJsonModel.create(newGeoJson);
      // geojson => pdl
      const geoData: GeoData = {
        geojson: createdGeoJson.geojson,
        mongo_id: createdGeoJson._id,
      };
      const pda = await this.generateGeoJsonDataPDA(keypair, geoData);

      // save the geojson onchain
      await program.methods
        .saveGeoJson({
          geojson: JSON.stringify(createdGeoJson.geojson),
          mongoId: createdGeoJson._id.toString(),
        })
        .accounts({
          user: provider.wallet.publicKey,
          geoJson: pda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      // save pdl
      const pdl = {
        pdl: pda.toString(),
        geojson: createdGeoJson._id,
        type: createGeojsonDto.pdl_type,
      };
      const createdPdl = await this.pdlModel.create(pdl);
      const updatedGeojsonRecord = await this.geoJsonModel.findOneAndUpdate(
        { _id: createdGeoJson._id },
        { pdl: createdPdl._id },
        { new: true },
      );
      // return the pdl string in the response instead of it's mongo id
      const updatedGeoJsonRecordObject = updatedGeojsonRecord.toObject();
      updatedGeoJsonRecordObject.pdl = createdPdl.pdl;
      return updatedGeoJsonRecordObject;
    } catch (error) {
      console.error(error);

      if (error.name === 'HttpException') {
        // throw the error that was caught
        throw error;
      }
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // generate pda using a given publicKey and mongodb _id of a given geojson record
  async generateGeoJsonDataPDA(keypair: web3.Keypair, geoData: GeoData) {
    const [pda] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode('geo-json-data'),
        keypair.publicKey.toBuffer(),
        Buffer.from(geoData.mongo_id.toString()),
      ],
      new web3.PublicKey(process.env.PROGRAM_ID),
    );
    return pda;
  }

  // find all accounts that have been created by the proto program
  async getCreatedAccounts(program: anchor.Program) {
    const data = await program.account.geoJsonData.all();
    return data;
  }

  // find matching geojson that has already been saved on chain
  async findExistingOnChain(program: anchor.Program, geojson: GeoJSON) {
    const allAccounts = await this.getCreatedAccounts(program);
    const duplicates = allAccounts.filter(
      (account) => account.account.geojson === JSON.stringify(geojson),
    );
    return duplicates;
  }

  findAll() {
    return `This action returns all geojson`;
  }

  findOne(id: number) {
    return `This action returns a #${id} geojson`;
  }

  update(id: number, updateGeojsonDto: UpdateGeojsonDto) {
    return `This action updates a #${id} geojson`;
  }

  remove(id: number) {
    return `This action removes a #${id} geojson`;
  }
}
