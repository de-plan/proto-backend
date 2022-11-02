import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Geometry, GeoJSON } from 'geojson';
import mongoose, { Document } from 'mongoose';

export type GeoJsonDocument = GeoJson & Document;

@Schema({ timestamps: true })
export class GeoJson {
  @Prop({ type: Object, required: true, unique: true })
  geometry: Geometry;

  @Prop({ type: Object, required: true })
  geojson: GeoJSON;

  @Prop({ required: true })
  geometry_string: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pdl',
    unique: true,
  })
  pdl: mongoose.Types.ObjectId;
}

export const GeoJsonSchema = SchemaFactory.createForClass(GeoJson);
