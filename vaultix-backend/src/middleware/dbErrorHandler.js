// middlewares/dbErrorHandler.js

const parsePostgresError = (err) => {
  if (!err || !err.code) return null;

  switch (err.code) {
    case '23505': { // UNIQUE violation
      const match = err.detail?.match(/\((.*?)\)=\((.*?)\)/);
      if (match) {
        const fields = match[1].split(', ').map(f => f.trim());
        const values = match[2].split(', ').map(v => v.trim());
        const message = `Duplicate entry for ${fields.map((f,i) => `${f}=${values[i]}`).join(', ')}`;
        return { type: 'unique_violation', message, fields, values, table: err.table, constraint: err.constraint };
      }
      return { type: 'unique_violation', message: 'Duplicate entry', table: err.table, constraint: err.constraint };
    }

    case '23503': { // FOREIGN KEY violation
      const match = err.detail?.match(/\((.*?)\)=\((.*?)\)/);
      const field = match ? match[1] : null;
      const value = match ? match[2] : null;
      const message = field && value ? `Foreign key violation: ${field}=${value} does not exist` : err.detail;
      return { type: 'foreign_key_violation', message, table: err.table, constraint: err.constraint, field, value };
    }

    case '23502': { // NOT NULL violation
      const match = err.detail?.match(/column "(.*?)"/);
      const column = match ? match[1] : null;
      const message = column ? `Column ${column} cannot be null` : 'Not null violation';
      return { type: 'not_null_violation', message, table: err.table, column };
    }

    case '23514': { // CHECK violation
      return { type: 'check_violation', message: err.detail || 'Check constraint violation', table: err.table, constraint: err.constraint };
    }

    case '23P01': { // EXCLUSION violation
      return { type: 'exclusion_violation', message: err.detail || 'Exclusion constraint violation', table: err.table, constraint: err.constraint };
    }

    default:
      return { type: 'unknown', message: err.message || 'Unknown database error' };
  }
};

const dbErrorHandler = (err, req, res, next) => {
  const pgError = parsePostgresError(err);

  if (pgError) {
    return res.status(400).json({
      success: false,
      error: {
        type: pgError.type,
        message: pgError.message,
        table: pgError.table,
        constraint: pgError.constraint,
        fields: pgError.fields,
        values: pgError.values,
        column: pgError.column,
      },
    });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = dbErrorHandler;