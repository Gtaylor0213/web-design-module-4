package server

import "database/sql"

// Nullable converts a string to sql.NullString. Empty string becomes NULL.
// API contract: clients send "" to mean "no value" for nullable columns;
// the database stores NULL.
func Nullable(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

// FromNullable converts a sql.NullString back to a plain string for JSON
// responses. NULL becomes "".
func FromNullable(n sql.NullString) string {
	if !n.Valid {
		return ""
	}
	return n.String
}
