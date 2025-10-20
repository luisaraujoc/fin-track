import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { CreditCardResponseDto } from './dto/credit-card-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('credit-cards')
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Post()
  create(
    @Body() createCreditCardDto: CreateCreditCardDto,
    @Request() req,
  ): Promise<CreditCardResponseDto> {
    return this.creditCardsService.create(createCreditCardDto, req.user.id);
  }

  @Get()
  findAll(@Request() req): Promise<CreditCardResponseDto[]> {
    return this.creditCardsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<CreditCardResponseDto> {
    return this.creditCardsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCreditCardDto: UpdateCreditCardDto,
    @Request() req,
  ): Promise<CreditCardResponseDto> {
    return this.creditCardsService.update(id, updateCreditCardDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.creditCardsService.remove(id, req.user.id);
  }
}