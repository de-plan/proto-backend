import { IsString, IsIn, IsOptional } from 'class-validator';
import { GeoJSON } from 'geojson';

export class CreateGeojsonDto {
    @IsString()
    @IsIn(['application', 'ownership'])
    pdl_type: 'application' | 'ownership';

    geojson: GeoJSON;
}
