import Joi from 'joi';

/**
 * Joi schema for validating individual sales records
 */
export const salesRecordSchema = Joi.object({
    sale_date: Joi.date().required().messages({
        'date.base': 'sale_date must be a valid date',
        'any.required': 'sale_date is required',
    }),
    order_id: Joi.string().trim().required().messages({
        'string.empty': 'order_id cannot be empty',
        'any.required': 'order_id is required',
    }),
    product_id: Joi.string().trim().required().messages({
        'string.empty': 'product_id cannot be empty',
        'any.required': 'product_id is required',
    }),
    product_name: Joi.string().trim().required().messages({
        'string.empty': 'product_name cannot be empty',
        'any.required': 'product_name is required',
    }),
    category: Joi.string().trim().required().messages({
        'string.empty': 'category cannot be empty',
        'any.required': 'category is required',
    }),
    region: Joi.string().trim().required().messages({
        'string.empty': 'region cannot be empty',
        'any.required': 'region is required',
    }),
    units: Joi.number().integer().positive().required().messages({
        'number.base': 'units must be a number',
        'number.positive': 'units must be greater than 0',
        'any.required': 'units is required',
    }),
    unit_price: Joi.number().positive().precision(2).required().messages({
        'number.base': 'unit_price must be a number',
        'number.positive': 'unit_price must be greater than 0',
        'any.required': 'unit_price is required',
    }),
});

/**
 * Validate array of sales records
 */
export const validateSalesData = (records) => {
    const errors = [];
    const validRecords = [];

    records.forEach((record, index) => {
        const { error, value } = salesRecordSchema.validate(record, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            errors.push({
                row: index + 1,
                errors: error.details.map((d) => d.message),
            });
        } else {
            validRecords.push(value);
        }
    });

    return { validRecords, errors };
};
