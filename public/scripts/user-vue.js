Vue.component('message-list', {
  props: ['messages'],
  template: `
<div v-if="messages" id="user-messages">
  <ul v-for="msg in messages" class="blog-list">
    <li v-bind:class="msg.class">
      <span class="message-text">{{ msg.text }}</span>
      <span class="flash-close" v-on:click="removeMessage(msg)">
      X
      </span>
    </li>
  </ul>
</div>
  `,
  data() {
    return {}
  },
  methods: {
    removeMessage(msg) {
      this.$emit('remove-message', msg)
    }
  },
  mounted () {
    // check messages in the database?
    // e.g. blog approved or rejected, blog failing, error with Pocket account, new feature?
  }
})

Vue.component('user-info', {
  props: ['user', 'messages'],
  data() {
    return {
      editing: false
    }
  },
  methods: {
    addMessage(msg) {
      this.messages.push(msg)
    },
    updateUser(event) {
      var params = {
        email : event.target.parentNode.email.value,
        twitter : event.target.parentNode.twitter.value,
        mastodon : event.target.parentNode.mastodon.value
      }
      axios.post('/api/v1/update/user/info', params)
      .then( response => {
        this.editing = false
        this.user.email = res.email
        if (response.data.user) {
          let res = response.data.user
          this.user.twitter = res.twitter
          this.user.mastodon = res.mastodon
        } else if (response.data.error) {
          this.addMessage(res.data.error)
        }
      })
      .catch( err => {
        // server errors should be caught in response.data.error
        // anything else is probably a 404
        console.log(err)
      })
    },
    cancelPocket() {
      axios.post('/api/v1/update/user/remove-pocket')
      .then( res => {
        this.addMessage(res.data)
        this.user.pocket = false
      })
    }
  },
  template: `
  <section>
    <div v-if="user && user.admin">
      <button class="" type="button" onclick="location.href='/admin'">Admin</button>
    </div>
    <h3 class="form-label">Your Info</h3>
    <form v-if="editing" name="user-info" id="user-info" method="POST">
      <div>
        <label for="email">Email:</label>
        <input id="email" name="email" v-model="user.email">
      </div>
      <div>
        <label for="twitter">Twitter:</label>
        <input id="twitter" name="twitter" v-model="user.twitter">
      </div>
      <div>
        <label for="mastodon">Mastodon:</label>
        <input id="mastodon" name="mastodon" v-model="user.mastodon">
      </div>
      <button class="update-button" v-on:click.prevent="updateUser" id="update-button">Update</button>
      <button class="update-button" v-on:click="editing = false">Cancel</button>
    </form>
    <div v-else>
      <div class="user-info">
        <div id="email">
          <span class="form-label">Email: </span>
          <span v-if="user">{{ user.email }}</span>
        </div>
        <div id="twitter">
          <span class="form-label">Twitter: </span>
          <span v-if="user">{{ user.twitter }}</span>
        </div>
        <div id="mastodon">
          <span class="form-label">Mastodon: </span>
          <span v-if="user">{{user.mastodon }}</span>
        </div>
      </div>
      <button v-on:click="editing = true">Edit</button>
    </div>
    <form id="pocket" class="pocket-info">
      <template v-if="user && user.pocket">
        <p>You are subscribed to receive articles straight to your <strong>{{ user.pocket.username }}</strong> Pocket list. Nice one!</p>
        <button v-on:click="this.cancelPocket" type="button">Cancel Pocket Subscription</button>
      </template>
      <button v-else type="button" onclick="location.href='/user/pocket'">Subscribe via Pocket</button>
    </form>
  </section>
  `
})

Vue.component('user-approved-blogs', {
  props: ['messages', 'categories'],
  data () {
    return {
      userIdString: null,
      blogs : [],
      editing: false
    }
  },
  mounted () {
    axios
    .get('/api/v1/user/blogs')
    .then(response => {
      this.userIdString = response.data.user
      this.blogs = response.data.blogs
      this.blogs.forEach( blog => {
        blog.deleting = false
        blog.editing = false
      })
      if (response.data.blogs.length == 0) {
        this.messages.push({class: 'flash-warning', text: 'You have no registered/approved blogs yet'})
      }
    })
    .catch( err => this.blogs = 'error')
  },
  methods: {
    addMessage(msg) {
      this.messages.push(msg)
    },
    deleteBlog(blog) {
      var payload = {
        blog: event.target.id,
        action: 'delete'
      }
      axios.post('api/v1/update/user/delete-blog', payload)
      .then( response => {
        var msg = response.data.msg || response.data.error
        this.addMessage(msg)
        blog.deleting = false
        if (response.data.blogs) {
          this.blogs = response.data.blogs
          Vue.set(this.blogs, this.blogs.indexOf(blog), blog)
        }
      })
    },
    editBlog(blog, index) {
      axios
      .post('/api/v1/update/user/edit-blog', {
        url: blog.url,
        category: blog.category
      })
      .then( response => {
        var msg = response.data.msg || response.data.error
        this.addMessage(msg)
        blog.editing = false
        if (response.data.msg) {
          Vue.set(this.blogs, index, blog) // on success message, simply update the blog client-side
        }
      })
    },
    cancelEditing(blog, index) {
      blog.editing = false
      Vue.set(this.blogs, index, blog)
    },
    checkingDeletion(blog) {
      blog.deleting = true
      Vue.set(this.blogs, this.blogs.indexOf(blog), blog)
    },
    checkingEditing(blog) {
      blog.editing = true
      Vue.set(this.blogs, this.blogs.indexOf(blog), blog)
    }
  },
  template: `
  <ul class="blog-list approved-blogs">
    <li v-for='blog in blogs' class="listed-blog" v-bind:class="{deleting: blog.deleting, editing: blog.editing}" v-bind:key="blog.id">
      <div class="approved-blog"></div>
      <span v-if="blog.title"><a v-bind:href="blog.url">{{ blog.title }}</a></span>
      <span v-else>{{ blog.url }}</span>
      <form class="blog-editing-form" v-if="blog.editing" name="blog-info" method="POST">
        <label for="category">Category:</label>
        <select v-model="blog.category" name="category">
          <option v-for="cat in categories" v-bind:value="cat">{{ cat }}</option>
        </select>
        <button class="" v-on:click.prevent="editBlog(blog, blogs.indexOf(blog))" id="update-button">Confirm update</button>
        <button class="" v-on:click.prevent="cancelEditing(blog, blogs.indexOf(blog))">Cancel</button>
      </form>
      <button class="" v-else v-bind:class="{hidden: blog.deleting}" v-on:click="checkingEditing(blog)" v-bind:id="blog.idString">Update</button>
      <button class="" v-if="blog.deleting" v-on:click="deleteBlog(blog)" v-bind:id="blog.idString">Confirm deletion</button>
      <span v-else-if="blog.editing"></span>
      <button class="" v-else v-on:click="checkingDeletion(blog)" v-bind:id="blog.idString">Delete</button>
    </li>
  </ul>
`
})

Vue.component('register-blog', {
  props: ['messages', 'ublogs', 'categories'],
  data () {
    return {
      registering: false,
      url: null,
      category: null
    }
  },
  methods: {
    addMessage(msg) {
      this.messages.push(msg)
    },
    validateUrl(input) {
      var regex = /http(s)?:\/\/([a-z0-9-_~:\/?#[\]@!$&'()*+,;=]*)(\.([a-z0-9-_~:\/?#[\]@!$&'()*+,;=]+)+)+/i
      return regex.test(input)
    },
    validate() {
      if (!this.validateUrl(this.url)) { 
        msg = {
          class: 'flash-error',
          text: 'please enter a valid url in the form http://example.com'
        }
        this.addMessage(msg)
      } else if (!this.category) {
        msg = {
          class: 'flash-error',
          text: 'you must select a category for your blog'
        }
        this.addMessage(msg)
      } else {
        this.registerBlog(this.url, this.category)
      }
    },
    registerBlog(url, category) {
      axios
      .post('/api/v1/update/user/register-blog', {
        url: url, 
        category: category
      })
      .then( response => {
        var msg = response.data.msg
        this.addMessage(msg)
       // if we get an ok status, we just update the list, 
       // rather than sending the full data back and forth
        if (response.data.status === 'ok') {
          this.$emit( 'update-ublogs', {url: url, approved: false})
          this.registering = false
        }
        this.url = null
        this.category = null
      })
      .catch(err => {
        console.log(err)
        this.addMessage({class: 'flash-error', text: err.message})
      })
    }
  },
  template: `
  <section>
    <form v-if="registering" class="register-blog">
      <label for="url">URL:</label>
      <input v-model="url" type="url" name="url" size="60"><br/>
      <label for="category">Category:</label>
      <select v-model="category" name="category">
      <option v-for="cat in categories" v-bind:value="cat">{{ cat }}</option>
      </select>
      <button class="register-blog-button" v-on:click.prevent="validate()">Register blog</button>
      <button v-on:click="registering = false">Cancel</button>
      </form>
    <button v-else v-on:click="registering = true">Register a new blog</button>
  </section>
  `
  })

Vue.component('user-unapproved-blogs', {
  props: ['messages', 'ublogs'],
  data () {
    return {
      category: null,
      url: null
    }
  },
  mounted () {
  
  },
  methods: {
    addMessage(msg) {
      this.messages.push(msg)
    }
  },
  template: `
  <ul class="blog-list unapproved-blogs" >
    <li v-for='blog in ublogs' v-bind:key="blog.idString" class="listed-blog">
      <div class="unapproved-blog"></div>
      <span v-if="blog.title"><a v-bind:href="blog.url">{{ blog.title }}</a></span>
      <span v-else>{{ blog.url }}</span>
      <span class="awaiting-approval"> - awaiting approval</span>
    </li>
  </ul>
  `
})

new Vue({
  el: '#main',
  data () {
    return {
      categories: [],
      messages: [],
      user: null,
      ublogs: []
    }
  },
  mounted () {
    axios
    .get('/api/v1/user/info')
    .then(response => {
      this.user = response.data
      if (response.data.error) {
        this.messages.push(response.data.error) // if the user is not registered yet
      }
    })
    .catch( err => this.user = 'error')

    axios
    .get('/api/v1/user/unapproved-blogs')
    .then(response => {
      this.ublogs = response.data
    })
    .catch( err => this.messages.push({class: 'flash-error', text: err}))

    axios
    .get('/api/v1/categories')
    .then( res => {
      this.categories = res.data.categories
    })

  },
  methods: {
    updateUblogs(args) {
      Vue.set(this.ublogs, this.ublogs.length, args) // add to the end of the blogs list
    },
    removeMessage(msg) {
      // fired when click on X to get rid of it
      Vue.delete(this.messages, this.messages.indexOf(msg))
    }
  }
})