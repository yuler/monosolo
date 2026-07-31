# TODO: only in development?

# john — after_create builds personal; then a team account
john = Identity.create!(email: "john@example.com")
Account.create_with_owner(
  account: { name: "John's first Account", description: "John's first account", personal: false },
  owner: { name: "John Doe", identity: john }
)

# yuler
yuler = Identity.create!(email: "yuler@example.com", staff: true)
Account.create_with_owner(
  account: { name: "Yuler's first Account", description: "Yuler's first account", personal: false },
  owner: { name: "Yuler Doe", identity: yuler }
)
