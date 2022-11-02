import { PartialType } from '@nestjs/mapped-types';
import { CreateGeojsonDto } from './create-geojson.dto';

export class UpdateGeojsonDto extends PartialType(CreateGeojsonDto) {}
