# john — after_create builds personal; then a team account
john = Identity.create!(email: "john@example.com")
Account.create_with_owner(
  account: { name: "John's first Account", description: "John's first account", personal: false },
  owner: { name: "John Doe", identity: john }
)

# yuler — staff for admin menu / Mission Control / stats
yuler = Identity.find_or_initialize_by(email: "yuler@example.com")
yuler.staff = true
yuler.save!
Account.create_with_owner(
  account: { name: "Yuler's first Account", description: "Yuler's first account", personal: false },
  owner: { name: "Yuler Doe", identity: yuler }
) unless yuler.accounts.where(personal: false).exists?
