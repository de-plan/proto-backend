import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type PdlDocument = Pdl & Document;

@Schema({ timestamps: true })
export class Pdl {
  @Prop({ required: true })
  pdl: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'geojson',
    required: true,
  })
  geojson: mongoose.Types.ObjectId;

  // application pdls can overlap and intersect
  @Prop({ type: String, enum: ['application', 'ownership'], required: true })
  type: 'application' | 'ownership';
}

export const PdlSchema = SchemaFactory.createForClass(Pdl);
