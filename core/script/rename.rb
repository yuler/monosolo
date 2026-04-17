require_relative "../config/environment"
require "thor"

class Renamer < Thor
  include Thor::Actions

  def self.source_root
    Rails.root
  end

  no_commands do
    def help_text
      <<~HELP
        Rename a file or directory

        USAGE:
        ruby script/rename.rb <new_app_name>

        EXAMPLES:
        ruby script/rename.rb my_new_project
      HELP
    end

    def replace_file_content(file_path, old_name, new_name)
      unless File.exist?(file_path)
        say "File #{file_path} does not exist", :yellow
        return
      end

      gsub_file file_path, old_name, new_name
    end
  end
end

renamer = Renamer.new
renamer.destination_root = Rails.root

# Main
new_app_name = ARGV[0]
if new_app_name.nil?
  puts renamer.help_text
  puts "\n" + "─" * 50
  print "Enter new name: "
  new_app_name = gets.chomp
end
old_app_name = Rails.application.class.module_parent_name

puts "Renaming project to #{new_app_name}..."

# camelize
renamer.replace_file_content("config/application.rb", /module #{old_app_name}/, "module #{new_app_name.camelize}")
renamer.replace_file_content("app/views/pwa/manifest.json.erb", /#{old_app_name}/, "#{new_app_name.camelize}")

# underscore
renamer.replace_file_content("config/application.rb", /lib\/#{old_app_name.underscore}/, "lib/#{new_app_name.underscore}")
renamer.replace_file_content(".env.example", /#{old_app_name.underscore}/, new_app_name.underscore)
renamer.replace_file_content("compose.example.yml", /#{old_app_name.underscore}/, new_app_name.underscore)
renamer.replace_file_content("Dockerfile", /#{old_app_name.underscore}/, new_app_name.underscore)
renamer.replace_file_content("config/deploy.yml", /#{old_app_name.underscore}/, new_app_name.underscore)

# confirm rename root directory
puts "Renaming root directory #{Rails.root} to #{new_app_name.underscore}"
puts "Are you sure you want to rename the root directory? (y/n)"
answer = gets.chomp
if answer == "y"
  FileUtils.mv(Rails.root, new_app_name.underscore)
end

puts "\nDone! Project renamed to #{new_app_name}"
