module RatingsHelper
  class << self
    def handle_rating_update(post)
      averages = calculate_topic_averages(post.topic)
      push_ratings_to_clients(post.topic, averages, post.id)
    end

    def calculate_topic_averages(topic)
      @topic_posts = Post.with_deleted.where(topic_id: topic.id)
      @ratings = []
      @rating1s = []
      @rating2s = []
      @averages = []

      @topic_posts.each do |tp|
        weight = tp.custom_fields["rating_weight"]
        if tp.custom_fields["rating"] && (weight.blank? || weight.to_i > 0)
          rating = tp.custom_fields["rating"].to_i
          rating1 = tp.custom_fields["rating1"].to_i
          rating2 = tp.custom_fields["rating2"].to_i
          @ratings.push(rating)
          @rating1s.push(rating1)
          @rating2s.push(rating2)
        end
      end

      average = @ratings.empty? ? nil : @ratings.inject(:+).to_f / @ratings.length
      average = average.round(1) if average

      average1 = @rating1s.empty? ? nil : @rating1s.inject(:+).to_f / @rating1s.length
      average1 = average1.round(1) if average1

      average2 = @rating2s.empty? ? nil : @rating2s.inject(:+).to_f / @rating2s.length
      average2 = average2.round(1) if average2

      topic.custom_fields["average_rating"] = average
      topic.custom_fields["average_rating1"] = average1
      topic.custom_fields["average_rating2"] = average2

      topic.save_custom_fields(true)

      return [average, average1, average2]
    end

    def push_ratings_to_clients(topic, averages, updatedId = '')
      channel = "/topic/#{topic.id}"
      msg = {
        updated_at: Time.now,
        averages: averages,
        post_id: updatedId,
        type: "revised"
      }
      MessageBus.publish(channel, msg, group_ids: topic.secure_group_ids)
    end

    ##def update_top_topics(post)
    ##  @category_topics = Topic.where(category_id: post.topic.category_id, tags: post.topic.tags[0])
    ##  @all_place_ratings = TopicCustomField.where(topic_id: @category_topics.map(&:id), name: "average_rating").pluck('value', 'topic_id').map(&:to_i)

    ## To do: Add a bayseian estimate of a weighted rating (WR) to WR = (v ÷ (v+m)) × R + (m ÷ (v+m)) × C
    ## R = average for the topic = (Rating); v = number of votes for the topic
    ## m = minimum votes required to be listed in the top list (currently 1)
    ## C = the mean vote for all topics
    ## See further http://bit.ly/1XLPS97 and http://bit.ly/1HJGW2g
    ##end

    ## This should be replaced with a :rated? property in TopicUser - but how to do this in a plugin?
    def has_rated?(topic, user_id)
      @user_posts = topic.posts.select { |post| post.user_id === user_id }
      PostCustomField.exists?(post_id: @user_posts.map(&:id), name: "rating")
    end
  end
end
