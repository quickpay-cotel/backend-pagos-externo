import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidAppKey(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidAppKey',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const appKeyEnv = process.env.APP_KEY; // Aquí cargas de .env
          return value === appKeyEnv;
        },
        defaultMessage(args: ValidationArguments) {
          return 'El appkey proporcionado no es válido.';
        }
      },
    });
  };
}
