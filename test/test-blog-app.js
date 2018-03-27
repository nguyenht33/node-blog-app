'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
	console.info('seeding blog posts data');
	const seedData = [];

	for (let i=1; i < 5; i++) {
		seedData.push(generateBlogPostData());
	}
	return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
	return {
		title: faker.lorem.sentence(),
		content: faker.lorem.paragraph(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		}
	}
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Blog Posts API', function() {

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogPostData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {

		it ('should return all existing blog posts', function() {
			let res;
			return chai.request(app)
				.get('/blog-posts')
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body.blogPosts).to.have.length.of.at.least(1);
					// return BlogPost.count();
				})
				// .then(function(count) {
    //   		expect(res.body.blogPosts).to.have.length.of(count);
				// });
		});

		it ('should return posts with right fields', function() {
			let resBlogPost;
			return chai.request(app)
				.get('/blog-posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.blogPosts).to.be.a('array');
					expect(res.body.blogPosts).to.have.length.of.at.least(1);

					res.body.blogPosts.forEach(function(blogPost) {
						expect(blogPost).to.be.a('object');
						expect(blogPost).to.include.keys(
							'id', 'title', 'content', 'author');
					});
					resBlogPost = res.body.blogPosts[0];
					return BlogPost.findById(resBlogPost.id);
				})
				.then(function(blogPost) {
					expect(resBlogPost.id).to.equal(blogPost.id);
					expect(resBlogPost.title).to.equal(blogPost.title);
					expect(resBlogPost.content).to.equal(blogPost.content);
					expect(resBlogPost.author).to.contain(blogPost.author.firstName);
					expect(resBlogPost.author).to.contain(blogPost.author.lastName);
				});
		});
	});

	describe('POST endpoint', function() {

		it('should add a new blog post', function() {
			const newBlogPost = generateBlogPostData();

			return chai.request(app)
				.post('/blog-posts')
				.send(newBlogPost)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.include.keys(
						'id', 'title', 'content', 'author');
					expect(res.body.id).to.not.be.null;
					expect(res.body.title).to.be.equal(newBlogPost.title);
					expect(res.body.content).to.be.equal(newBlogPost.content);
					expect(res.body.author).to.be.contain(newBlogPost.author.firstName);
					expect(res.body.author).to.be.contain(newBlogPost.author.lastName);
					return BlogPost.findById(res.body.id);
				})
				.then(function(blogPost) {
					expect(blogPost.title).to.equal(newBlogPost.title);
					expect(blogPost.content).to.equal(newBlogPost.content);
					expect(blogPost.author.firstName).to.equal(newBlogPost.author.firstName);
					expect(blogPost.author.lastName).to.equal(newBlogPost.author.lastName);
				});
		});
	});

	describe('PUT endpoint', function() {

		it('should update fields you send over', function() {
			const updateData = {
				title: 'Today This is What I Think',
				content: 'Not much in this mind'
			};

			return BlogPost
				.findOne()
				.then(function(blogPost) {
					updateData.id = blogPost.id;

					return chai.request(app)
						.put(`/blog-posts/${blogPost.id}`)
						.send(updateData);
				})
				.then(function(res) {
					expect(res).to.have.status(204);
					return BlogPost.findById(updateData.id);
				})
				.then(function(blogPost) {
					expect(blogPost.title).to.equal(updateData.title);
					expect(blogPost.content).to.equal(updateData.content);
				});
		});
	});

	describe('DELETE endpoint', function() {

		it('delete a blog post by id', function() {
			let blogPost;

			return BlogPost
				.findOne()
				.then(function(_blogPost) {
					blogPost = _blogPost;
					return chai.request(app).delete(`/blog-posts/${blogPost.id}`);
				})
				.then(function(res) {
					expect(res).to.have.status(204);
					return BlogPost.findById(blogPost.id);
				})
				.then(function(_blogPost) {
					expect(_blogPost).to.be.null;
				});
		});
	});
});