# Identities — after_create builds a personal account
yuler = Identity.create!(email: "yuler@example.com", staff: true)
john = Identity.create!(email: "john@example.com")

# Accounts — additional team accounts
Account.create_with_owner(
  account: { name: "Yuler's first Account", description: "Yuler's first account" },
  owner: { name: "Yuler Doe", identity: yuler }
)
Account.create_with_owner(
  account: { name: "John's first Account", description: "John's first account" },
  owner: { name: "John Doe", identity: john }
)
