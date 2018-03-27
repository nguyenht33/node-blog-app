'user strict';

const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: {type: String, required: true},
	author: {
		firstName: String,
		lastName: String
	},
	created: Date
}, {collection: 'blogPosts'}); // explain this headache //

blogPostSchema.virtual('fullName').get(function() {
	return `${this.author.firstName} ${this.author.lastName}`;
});

blogPostSchema.methods.serialize = function() {

	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.fullName,
		created: this.created
	};
}

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {BlogPost};
