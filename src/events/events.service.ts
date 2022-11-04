import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Pdl, PdlDocument } from '../models/pdl.schema';
import { Event, EventDocument } from '../models/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Pdl.name) private pdlModel: Model<PdlDocument>,
  ) {}
  async create(createEventDto: CreateEventDto) {
    const pdlExists = await this.pdlModel.findOne({
      pdl: createEventDto.pdl,
    });
    if (!pdlExists) {
      throw new HttpException(
        'The provided pdl does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    const event = await this.eventModel.create({ ...createEventDto });
    return event;
  }

  findAll() {
    return `This action returns all events`;
  }

  findOne(id: number) {
    return `This action returns a #${id} event`;
  }

  update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
