import { z, ZodObject, ZodTypeAny } from "zod";

// Example configuration for nested fields

type StringFieldConfig = {
    type: "string";
    minLength?: number;
};

type NumberFieldConfig = {
    type: "number";
    int?: boolean;
    positive?: boolean;
};

type ArrayFieldConfig = {
    type: "array";
    itemType: FieldConfig; // Recursive type to allow arrays of any field type
};

type ObjectFieldConfig = {
    type: "object";
    shape: {
        [key: string]: FieldConfig; // Recursive type to allow nested objects
    };
};

type FieldConfig =
    | StringFieldConfig
    | NumberFieldConfig
    | ArrayFieldConfig
    | ObjectFieldConfig;

type FieldConfigMap = {
    [key: string]: FieldConfig;
};



const fieldConfig: FieldConfigMap = {
    name: { type: "string", minLength: 2 },
    address: {
        type: "object",
        shape: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string", minLength: 5 },
        },
    },
    tags: { type: "array", itemType: { type: "string" } },
};

export function createDynamicSchema(config: FieldConfigMap) {
    const schemaShape: { [key: string]: ZodTypeAny } = {};

    Object.entries(config).forEach(([key, value]) => {
        switch (value.type) {
            case "string":
                let stringSchema = z.string();
                if (value.minLength) stringSchema = stringSchema.min(value.minLength);
                schemaShape[key] = stringSchema;
                break;

            case "number":
                let numberSchema = z.number();
                if (value.int) numberSchema = numberSchema.int();
                if (value.positive) numberSchema = numberSchema.positive();
                schemaShape[key] = numberSchema;
                break;

            case "object":
                schemaShape[key] = createDynamicSchema(value.shape);
                break;

            case "array":
                schemaShape[key] = z.array(createDynamicSchema({ item: value.itemType }));
                break;

            // Handle other types as needed
            default:
                throw new Error(`Unsupported field type on value: ${value}`);
        }
    });

    return z.object(schemaShape)
}

const dynamicSchema = createDynamicSchema(fieldConfig);

// Test the dynamic schema
const testData = {
    name: "John",
    address: { street: "123 Main St", city: "Springfield", zip: "12345" },
    tags: ["developer", "gamer"],
};
const result = dynamicSchema.safeParse(testData);

console.log(result);
