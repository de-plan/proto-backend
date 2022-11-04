import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Object, required: true })
  event: object;

  @Prop({
    type: String,
    ref: 'pdl',
    required: true,
  })
  pdl: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
