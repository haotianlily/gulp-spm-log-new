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

exports.addSpmlog = function(options) {
    var logkey = options.logkey;
    var filter = options.filter;

    return through2.obj(function(file, enc, cb) {

        if (!logkey) {
            return cb(new Error('spmlog', '缺少黄金令箭埋点串字段：logkey'));
        }

        if (!filter || !util.isArray(filter)) {
            return cb(new Error('spmlog', '缺少元素过滤规则字段：filter'));
        }

        var html = file.contents.toString('utf8');
        var filename = file.relative;
        var clickStr = 'gostr=/' + logkey + ';locaid=d';
        var rlogkey = new RegExp('(gostr=\\/([^\\"]+);)', 'g');

        // 如果原来就有logkey并且与当前要设置的不相同，则替换成新的
        html = html.replace(rlogkey, function (m, $1, $2) {
            if ($2 && $2 != logkey) {
                return 'gostr=/' + logkey + ';';
            } else {
                return $1;
            }
        });

        filter.forEach(function (item) {
            var pattern = sizzle(item);
            var keyStr = 'data-spm-click'
            if (!pattern || !util.isArray(pattern)) {
                return cb(new Error('spmlog', 'spmlog暂不支持此元素过滤器：' + item));
            }
            if(pattern[0].indexOf('mouseenter') >= 0){
                keyStr = 'data-spm-mouseenter'
            }
            var rmatch = new RegExp('(' + pattern[0] + '(?!\\s*' + keyStr + '="[^\\"]+"))', 'g');
            var rvalue = new RegExp(pattern[1]);
            
            html = html.replace(rmatch, function (m, $1, $2) {
                if (rvalue.test($2)) {
                    var locaid = sutil.genRandom().substring(0, 8);
                    return $1 + ' ' + keyStr + '="' + clickStr + locaid + '"';
                } else {
                    return $1;
                }
            });
        });

        file.contents = new Buffer(html);

        cb(null, file);
    });
}


/**
 * 删掉已有的埋点
 */ 

exports.deleteSpmlog = function() {
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
