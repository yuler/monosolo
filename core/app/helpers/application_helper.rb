module ApplicationHelper
  def page_title_tag
    account_name = if Current.account && Current.session&.identity&.users&.many?
      Current.account&.name
    end
    # TODO: Rename
    tag.title [ @page_title, account_name, "Rails Starter" ].compact.join(" | ")
  end
end
