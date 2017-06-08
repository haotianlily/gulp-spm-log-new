var fs        = require('fs');
var path      = require("path");
var util      = require('util');
var gutil     = require('gulp-util');
var through2  = require('through2');
var sutil     = require('./lib/sutil');
var sizzle    = require('./lib/sizzle');
var Error     = gutil.PluginError;


/**
 * 给满足筛选条件的节点添加data-spm-click属性
 * 对于已经生成过data-spm-click属性的节点，直接跳过
 * 因为data-spm-click属性需要保持固定，只初始化生成一次
 * 如果需要重新生成，可以把原来的属性删除掉
 */ 

function deleteSpm(options) {
    return through2.obj(function(file, enc, cb) {

        var html = file.contents.toString('utf8');
        var filename = file.relative;
        //var spmlogkey = new RegExp('(data-spm-click="gostr=\\/([^\\"]+);locaid=+)', 'g');
        var spmlogKey=/data-spm-(?:click|mouseenter)\s*=\s*"[^"]+"/g;
        //var mouselogkey = new RegExp('(data-spm-mouseenter="gostr=\\/([^\\"]+);locaid=+)', 'g');
        // 删掉data-spm-click属性
        html = html.replace(spmlogKey, '');

    

        file.contents = new Buffer(html);

        cb(null, file);
    });
}

module.exports = deleteSpm;