class AddEndDatetimeToEvents < ActiveRecord::Migration[6.0]
  def change
    add_column :events, :end_datetime, :datetime
  end
end