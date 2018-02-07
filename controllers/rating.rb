class DiscourseRatings::RatingController < ::ApplicationController
  def rate
    params.require(:post_id)
    # params.require(:rating)
    # params.require(:rating1)
    # params.require(:rating2)
    # params.require(:rating3)

    if :rating && :rating1 && :rating2 && :rating3
      post = Post.find(params[:post_id].to_i)
      post.custom_fields["rating"] = params[:rating].to_i
      post.custom_fields["rating1"] = params[:rating1].to_i
      post.custom_fields["rating2"] = params[:rating2].to_i
      post.custom_fields["rating3"] = params[:rating3].to_i
      post.custom_fields["rating_weight"] = 1
      post.save_custom_fields(true)
      RatingsHelper.handle_rating_update(post)
    end 

    render json: success_json
  end

  def remove
    params.require(:post_id)

    id = params[:post_id].to_i
    post = Post.find(id)
    PostCustomField.where(post_id: id, name: "rating").destroy_all
    PostCustomField.where(post_id: id, name: "rating1").destroy_all
    PostCustomField.where(post_id: id, name: "rating2").destroy_all
    PostCustomField.where(post_id: id, name: "rating3").destroy_all
    PostCustomField.where(post_id: id, name: "rating_weight").destroy_all

    RatingsHelper.handle_rating_update(post)

    render json: success_json
  end
end
