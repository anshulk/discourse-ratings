# name: discourse-ratings
# about: A Discourse plugin that lets you use topics to rate things
# version: 0.2
# authors: Angus McLeod
# url: https://github.com/angusmcleod/discourse-ratings

register_asset 'stylesheets/common/ratings.scss'
register_asset 'stylesheets/mobile/ratings.scss', :mobile

Discourse.top_menu_items.push(:ratings)
Discourse.anonymous_top_menu_items.push(:ratings)
Discourse.filters.push(:ratings)
Discourse.anonymous_filters.push(:ratings)

after_initialize do
  Category.register_custom_field_type('rating_enabled', :boolean)

  module ::DiscourseRatings
    class Engine < ::Rails::Engine
      engine_name "discourse_ratings"
      isolate_namespace DiscourseRatings
    end
  end

  DiscourseRatings::Engine.routes.draw do
    post "/rate" => "rating#rate"
    post "/remove" => "rating#remove"
  end

  Discourse::Application.routes.append do
    mount ::DiscourseRatings::Engine, at: "rating"
  end

  load File.expand_path('../controllers/rating.rb', __FILE__)
  load File.expand_path('../serializers/rating_list.rb', __FILE__)
  load File.expand_path('../lib/ratings_helper.rb', __FILE__)

  TopicView.add_post_custom_fields_whitelister do |user|
    ["rating", "rating1", "rating2", "rating3", "rating_weight"]
  end

  TopicList.preloaded_custom_fields << "average_rating" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "rating_count" if TopicList.respond_to? :preloaded_custom_fields

  TopicList.preloaded_custom_fields << "average_rating1" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "rating_count" if TopicList.respond_to? :preloaded_custom_fields

  TopicList.preloaded_custom_fields << "average_rating2" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "rating_count" if TopicList.respond_to? :preloaded_custom_fields

  TopicList.preloaded_custom_fields << "average_rating3" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "rating_count" if TopicList.respond_to? :preloaded_custom_fields

  add_permitted_post_create_param('rating')
  add_permitted_post_create_param('rating1')
  add_permitted_post_create_param('rating2')
  add_permitted_post_create_param('rating3')
  add_permitted_post_create_param('rating_target_id')

  DiscourseEvent.on(:post_created) do |post, opts, user|
    if opts[:rating]
      post.custom_fields['rating'] = opts[:rating]
      post.custom_fields['rating1'] = opts[:rating1]
      post.custom_fields['rating2'] = opts[:rating2]
      post.custom_fields['rating3'] = opts[:rating3]
      post.custom_fields["rating_weight"] = 1
      post.save_custom_fields(true)
      RatingsHelper.handle_rating_update(post)
    end

    if opts[:rating_target_id]
      topic = Topic.find(post.topic_id)
      topic.custom_fields['rating_target_id'] = opts[:rating_target_id]
      topic.save_custom_fields(true)
    end
  end

  DiscourseEvent.on(:post_destroyed) do |post, opts, user|
    if post.custom_fields['rating']
      post.custom_fields["rating_weight"] = 0
      post.save_custom_fields(true)
      RatingsHelper.handle_rating_update(post)
    end
  end

  DiscourseEvent.on(:post_recovered) do |post, _opts, user|
    if post.custom_fields['rating']
      post.custom_fields["rating_weight"] = 1
      post.save_custom_fields(true)
      RatingsHelper.handle_rating_update(post)
    end
  end

  PostRevisor.track_topic_field(:rating_target_id)

  PostRevisor.class_eval do
    track_topic_field(:rating_target_id) do |tc, rating_target_id|
      tc.record_change('rating_target_id', tc.topic.custom_fields['rating_target_id'], rating_target_id)
      tc.topic.custom_fields['rating_target_id'] = rating_target_id
    end
  end

  require 'topic'
  class ::Topic
    def average_rating
      self.custom_fields["average_rating"].to_f
    end

    def average_rating1
      self.custom_fields["average_rating1"].to_f
    end

    def average_rating2
      self.custom_fields["average_rating2"].to_f
    end

    def average_rating3
      self.custom_fields["average_rating3"].to_f
    end

    def rating_enabled?
      has_rating_tag = !(tags & SiteSetting.rating_tags.split('|')).empty?
      is_rating_category = self.category && self.category.custom_fields["rating_enabled"]
      is_rating_topic = self.subtype == 'rating'
      has_rating_tag || is_rating_category || is_rating_topic
    end

    def rating_count
      self.posts.where("id in (
        (SELECT post_id FROM post_custom_fields WHERE name = 'rating') INTERSECT
        (SELECT post_id FROM post_custom_fields WHERE name = 'rating_weight' AND value = '1')
      )").count
    end

    def rating_target_id
      self.custom_fields["rating_target_id"]
    end
  end

  require 'topic_view_serializer'
  class ::TopicViewSerializer
    attributes :average_rating, :average_rating1, :average_rating2, :average_rating3, :rating_enabled, :rating_count, :can_rate, :rating_target_id, :has_ratings

    def average_rating
      object.topic.average_rating
    end

    def average_rating1
      object.topic.average_rating1
    end

    def average_rating2
      object.topic.average_rating2
    end

    def average_rating3
      object.topic.average_rating3
    end

    def include_average_rating?
      has_ratings
    end

    def rating_enabled
      object.topic.rating_enabled?
    end

    def rating_count
      object.topic.rating_count
    end

    def include_rating_count?
      has_ratings
    end

    def has_ratings
      object.topic.rating_count.to_i > 0
    end

    def can_rate
      scope.current_user && rating_enabled && !RatingsHelper.has_rated?(object, scope.current_user.id)
    end

    def rating_target_id
      object.topic.rating_target_id
    end
  end

  require 'topic_list_item_serializer'
  class ::TopicListItemSerializer
    attributes :average_rating, :average_rating1, :average_rating2, :average_rating3, :rating_count, :show_average, :has_ratings

    def average_rating
      object.average_rating
    end

    def average_rating1
      object.average_rating1
    end

    def average_rating2
      object.average_rating2
    end

    def average_rating3
      object.average_rating3
    end

    def include_average_rating?
      has_ratings
    end

    def rating_count
      object.rating_count
    end

    def include_rating_count?
      has_ratings
    end

    def has_ratings
      object.rating_count.to_i > 0
    end

    def show_average
      object.rating_enabled?
    end
  end

  add_to_serializer(:basic_category, :rating_enabled) { object.custom_fields["rating_enabled"] }
  add_to_serializer(:post, :rating) { post_custom_fields["rating"] }
  add_to_serializer(:post, :rating1) { post_custom_fields["rating1"] }
  add_to_serializer(:post, :rating2) { post_custom_fields["rating2"] }
  add_to_serializer(:post, :rating3) { post_custom_fields["rating3"] }

  require_dependency 'topic_query'
  class ::TopicQuery
    def list_ratings
      create_list(:ratings, ascending: 'true') do |topics|
        topics.where(subtype: 'rating')
      end
    end
  end
end
