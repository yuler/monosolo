# Database

This project uses `sqlite` as the sole database system. 

```bash
# Dump the schema
RAILS_ENV=production ./bin/rails db:schema:dump

# Run migrations
RAILS_ENV=production ./bin/rails db:migrate

# Reset the database
./bin/rails db:reset
```
