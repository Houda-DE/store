import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Store API')
    .setDescription('WeStore marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User registration, login, and email verification')
    .addTag('Users', 'Current user profile management')
    .addTag('Locations', 'Countries and cities for location selection')
    .addTag('Items', 'Marketplace item listings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();