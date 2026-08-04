# Identities — after_create builds a personal account
yuler = Identity.find_or_initialize_by(email: "yuler@example.com")
yuler.staff = true
yuler.save!

john = Identity.find_or_initialize_by(email: "john@example.com")
john.save!

# Accounts — additional team accounts
unless yuler.accounts.where(personal: false, name: "Yuler's first Account").exists?
  Account.create_with_owner(
    account: { name: "Yuler's first Account", description: "Yuler's first account" },
    owner: { name: "Yuler Doe", identity: yuler }
  )
end

unless john.accounts.where(personal: false, name: "John's first Account").exists?
  Account.create_with_owner(
    account: { name: "John's first Account", description: "John's first account" },
    owner: { name: "John Doe", identity: john }
  )
end
