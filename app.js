var yaml = require('yaml-front-matter'),
    dir = require('node-dir'),
    async = require('async'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    slugify = require('slugify3')

function removeStub(content) {
  content = content.replace('filename: /:year/:month/:title/index.html\n', '')
  content = content.replace(/template: article.jade\n/, '')
  content = content.replace(/category:.*\n/, '')
  return content
}


function fail(err) {
  if (err) throw err
}

function copyResources(src, dst, callback) {
  fs.readdir(src, function(err, files) {
    fail(err)
    async.each(files, function(file, cb) {
      if(!/\.md$/.exec(file)) {
        output = fs.createWriteStream(path.join(dst, file))
        input = fs.createReadStream(path.join(src, file))
        input.pipe(output)
      }
    }, callback)

  })
}

function transformFile(file, callback) {
  if(/\.md$/.exec(file)) {
    fs.readFile(file, function(err, data) {
      fail(err)
      var content = removeStub(data.toString('utf-8'))
      var doc = yaml.loadFront(data.toString('utf-8'));
      if(doc.title) {
        var dst_folder = path.join('./new-contents/articles/', doc.category ? slugify(doc.category) : 'ohne-kategorie', slugify(doc.title))
        var dst = path.join(dst_folder, path.basename(file))

        async.series([
          (cb) => mkdirp(dst_folder, cb),
          (cb) => fs.writeFile(dst, content, cb),
          (cb) => /index\.md$/.exec(file) ? copyResources(path.dirname(file), dst_folder, cb) : cb(),
          function(cb) { console.log(dst); cb()},
        ], callback)
      }
    })
  }
}

async.series([
  (cb) => fs.mkdir('./new-contents/', () => cb()),
  (cb) => dir.files('./contents/',
    function(err, files) {
      fail(err)
      async.each(files, transformFile, cb)
  })
], (err, doc) => fail(err))


