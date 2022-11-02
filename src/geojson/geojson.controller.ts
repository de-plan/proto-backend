import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GeojsonService } from './geojson.service';
import { CreateGeojsonDto } from './dto/create-geojson.dto';
import { UpdateGeojsonDto } from './dto/update-geojson.dto';

@Controller('geojson')
export class GeojsonController {
  constructor(private readonly geojsonService: GeojsonService) {}

  @Post()
  create(@Body() createGeojsonDto: CreateGeojsonDto) {
    return this.geojsonService.create(createGeojsonDto);
  }

  @Get()
  findAll() {
    return this.geojsonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.geojsonService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGeojsonDto: UpdateGeojsonDto) {
    return this.geojsonService.update(+id, updateGeojsonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.geojsonService.remove(+id);
  }
}
