import { z, ZodObject, ZodTypeAny } from "zod";
import {
  ArrayFieldDefinition,
  BooleanFieldDefinition,
  DateFieldDefinition,
  FieldDefinition,
  IDTOBuilderAndValidator,
  NumberFieldDefinition,
  ObjectFieldDefinition,
  StringFieldDefinition,
} from "./IFieldsValidator";
import { ValidationError } from "../error/ValidationError";

export class ZodDTOBuilderAndValidator<T>
  implements IDTOBuilderAndValidator<T>
{
  private internalSchema: ZodObject<any> | null = null;

  defineSchema(...fields: FieldDefinition[]): IDTOBuilderAndValidator<T> {
    const schemaFields: { [key: string]: ZodTypeAny } = {};

    for (const field of fields) {
      schemaFields[field.name] = this.buildSingleFieldSchema(field);
    }

    this.internalSchema = z.object(schemaFields);
    return this;
  }

  private buildSingleFieldSchema(
    field: FieldDefinition,
    forceOptional: boolean = false
  ): ZodTypeAny {
    let zodType: ZodTypeAny;
    const baseMessage = field.message;

    switch (field.type) {
      case "string":
        const stringField = field as StringFieldDefinition;
        let stringSchema = z.string({
          required_error:
            stringField.requiredMessage ||
            baseMessage ||
            `${stringField.name} é obrigatório.`,
          invalid_type_error:
            stringField.message || `${stringField.name} deve ser uma string.`,
        });
        if (stringField.minLength !== undefined)
          stringSchema = stringSchema.min(
            stringField.minLength,
            stringField.minLengthMessage ||
              baseMessage ||
              `${stringField.name} deve ter no mínimo ${stringField.minLength} caracteres.`
          );
        if (stringField.maxLength !== undefined)
          stringSchema = stringSchema.max(
            stringField.maxLength,
            stringField.maxLengthMessage ||
              baseMessage ||
              `${stringField.name} deve ter no máximo ${stringField.maxLength} caracteres.`
          );
        if (stringField.pattern)
          stringSchema = stringSchema.regex(
            stringField.pattern,
            stringField.patternMessage ||
              baseMessage ||
              `${stringField.name} não segue o padrão esperado.`
          );
        if (stringField.email)
          stringSchema = stringSchema.email(
            stringField.emailMessage ||
              baseMessage ||
              `${stringField.name} deve ser um e-mail válido.`
          );
        if (stringField.url)
          stringSchema = stringSchema.url(
            stringField.urlMessage ||
              baseMessage ||
              `${stringField.name} deve ser uma URL válida.`
          );
        if (stringField.uuid)
          stringSchema = stringSchema.uuid(
            stringField.uuidMessage ||
              baseMessage ||
              `${stringField.name} deve ser um UUID válido.`
          );
        zodType = stringSchema;
        break;

      case "number":
        const numberField = field as NumberFieldDefinition;
        let numberSchema = z.number({
          required_error:
            numberField.requiredMessage ||
            baseMessage ||
            `${numberField.name} é obrigatório.`,
          invalid_type_error:
            numberField.message || `${numberField.name} deve ser um número.`,
        });
        if (numberField.min !== undefined)
          numberSchema = numberSchema.min(
            numberField.min,
            numberField.minMessage ||
              baseMessage ||
              `${numberField.name} deve ser no mínimo ${numberField.min}.`
          );
        if (numberField.max !== undefined)
          numberSchema = numberSchema.max(
            numberField.max,
            numberField.maxMessage ||
              baseMessage ||
              `${numberField.name} deve ser no máximo ${numberField.max}.`
          );
        if (numberField.integer)
          numberSchema = numberSchema.int(
            numberField.integerMessage ||
              baseMessage ||
              `${numberField.name} deve ser um número inteiro.`
          );
        if (numberField.positive)
          numberSchema = numberSchema.positive(
            numberField.positiveMessage ||
              baseMessage ||
              `${numberField.name} deve ser um número positivo.`
          );
        if (numberField.nonNegative)
          numberSchema = numberSchema.nonnegative(
            numberField.nonNegativeMessage ||
              baseMessage ||
              `${numberField.name} deve ser um número não negativo.`
          );
        zodType = numberSchema;
        break;

      case "boolean":
        const booleanField = field as BooleanFieldDefinition;
        zodType = z.boolean({
          required_error:
            booleanField.requiredMessage ||
            baseMessage ||
            `${booleanField.name} é obrigatório.`,
          invalid_type_error:
            booleanField.message ||
            `${booleanField.name} deve ser um booleano.`,
        });
        break;

      case "date":
        const dateField = field as DateFieldDefinition;
        let dateSchema = z.date({
          required_error:
            dateField.requiredMessage ||
            baseMessage ||
            `${dateField.name} é obrigatória.`,
          invalid_type_error:
            dateField.message || `${dateField.name} deve ser uma data válida.`,
        });
        if (dateField.minDate)
          dateSchema = dateSchema.min(
            dateField.minDate,
            dateField.minDateMessage ||
              baseMessage ||
              `${
                dateField.name
              } deve ser igual ou posterior a ${dateField.minDate.toLocaleDateString()}.`
          );
        if (dateField.maxDate)
          dateSchema = dateSchema.max(
            dateField.maxDate,
            dateField.maxDateMessage ||
              baseMessage ||
              `${
                dateField.name
              } deve ser igual ou anterior a ${dateField.maxDate.toLocaleDateString()}.`
          );
        zodType = dateSchema;
        break;

      case "array":
        const arrayField = field as ArrayFieldDefinition;
        if (!arrayField.items) {
          throw new Error(
            `Definição de 'items' é obrigatória para campo array: ${arrayField.name}`
          );
        }
        const itemSchema = this.buildSingleFieldSchema(arrayField.items);
        let arraySchema = z.array(itemSchema, {
          required_error:
            arrayField.requiredMessage ||
            baseMessage ||
            `${arrayField.name} é obrigatório.`,
          invalid_type_error:
            arrayField.message || `${arrayField.name} deve ser um array.`,
        });
        if (arrayField.minItems !== undefined)
          arraySchema = arraySchema.min(
            arrayField.minItems,
            arrayField.minItemsMessage ||
              baseMessage ||
              `${arrayField.name} deve ter no mínimo ${arrayField.minItems} itens.`
          );
        if (arrayField.maxItems !== undefined)
          arraySchema = arraySchema.max(
            arrayField.maxItems,
            arrayField.maxItemsMessage ||
              baseMessage ||
              `${arrayField.name} deve ter no máximo ${arrayField.maxItems} itens.`
          );
        zodType = arraySchema;
        break;

      case "object":
        const objectField = field as ObjectFieldDefinition;
        if (!objectField.fields || objectField.fields.length === 0) {
          throw new Error(
            `Definição de 'fields' é obrigatória e não pode ser vazia para campo object: ${objectField.name}`
          );
        }
        const nestedSchemaFields: { [key: string]: ZodTypeAny } = {};
        for (const nestedField of objectField.fields) {
          nestedSchemaFields[nestedField.name] = this.buildSingleFieldSchema(
            nestedField,
            true
          );
        }
        zodType = z.object(nestedSchemaFields);
        break;

      case "any":
      default:
        zodType = z.any();
        break;
    }

    if (!field.required || forceOptional) {
      zodType = zodType.optional();
    }

    return zodType;
  }

  validate(data: T): void {
    if (!this.internalSchema) {
      throw new Error(
        "O schema não foi definido. Chame 'defineSchema' primeiro."
      );
    }
    const result = this.internalSchema.safeParse(data);
    if (!result.success) {
      const errorDetails = result.error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      throw new ValidationError("Erro de validação do DTO", errorDetails);
    }
  }

  validateAndTransform(data: T): T {
    if (!this.internalSchema) {
      throw new Error(
        "O schema não foi definido. Chame 'defineSchema' primeiro."
      );
    }
    try {
      return this.internalSchema.parse(data) as T;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        }));
        throw new ValidationError(
          "Erro de validação e transformação do DTO",
          errorDetails
        );
      }
      throw error;
    }
  }

  getSchema(): ZodObject<any> {
    if (!this.internalSchema) {
      throw new Error(
        "O schema não foi definido. Chame 'defineSchema' primeiro."
      );
    }
    return this.internalSchema;
  }
}
