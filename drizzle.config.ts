import { defineConfig } from "drizzle-kit";
export default defineConfig({
	schema: "./src/lib/database/schema.ts",
	driver: "pg",
	dbCredentials: {
		connectionString: process.env.DB_URL!,
	},
	verbose: true,
	strict: true,
});
