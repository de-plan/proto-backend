import { Module } from '@nestjs/common';
import { GeojsonService } from './geojson.service';
import { GeojsonController } from './geojson.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GeoJson, GeoJsonSchema } from '../models/geojson.schema';
import { Pdl, PdlSchema } from '../models/pdl.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GeoJson.name, schema: GeoJsonSchema }]),
    MongooseModule.forFeature([{ name: Pdl.name, schema: PdlSchema }]),
  ],
  controllers: [GeojsonController],
  providers: [GeojsonService],
})
export class GeojsonModule {}
