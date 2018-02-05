class DiscourseRatings::RatingListSerializer < ::ApplicationSerializer
  attributes :id, :title, :url, :averages, :category_id, :featured_link

  def averages
    object.custom_fields["averages"]
  end

  def url
    object.relative_url
  end
end
