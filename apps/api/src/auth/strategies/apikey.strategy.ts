import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import  Strategy  from 'passport-headerapikey';
import { KeysService } from 'src/keys/keys.service';


@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy,"api-key") {
  constructor(private keyService: KeysService) {
    super({ header: 'x-api-key', prefix: '' }, true,async (apikey, done) => {
      // In a real-world app, this would be fetched from the database
    
      if (await keyService.isValidKey(apikey)) {
        return done(null, true);
      } else {
        return done(new UnauthorizedException(), null);
      }
    });
  }
}