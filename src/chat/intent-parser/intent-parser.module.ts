import { Module } from '@nestjs/common';
import { IntentParserService } from './intent-parser.service';

@Module({
  providers: [IntentParserService],
  exports: [IntentParserService],
})
export class IntentParserModule {}
