/**
 * @author Sign
 * @version 1.0
 * @date 2015-11-10
 * @description 重力感应插件
 * @extends mo.Base
 * @name mo.Gyro
*/
define(function(require, exports, module) {
	require('../base/base.js');
	
	Motion.add('mo.Gyro:mo.Base', function() {
		/**
		 * public 作用域
		 * @alias mo.Gyro#
		 * @ignore
		 */
		var _public = this;

		var _private = {};

		/**
		 * public static作用域
		 * @alias mo.Gyro.
		 * @ignore
		 */

		var _static = this.constructor;

		_static.config = {
			sens: 300,	//动作判定间隔时间
			mode: 'm1',	//元素响应模式
			callback: function(){}
		}

		//上次坐标，用来计算改变速度
		var last_coor = {};
		var coor = {};
		var last_gravity = {};
		var gravity = {};

		//陀螺仪对目标元素位移产生的增幅
		var page_scale_x = screen.width / 140;
		var page_scale_y = screen.height / 60;

		//初始位置
		var ori;

		//时间参数
		var cur_time = last_time = new Date().getTime();

		//设置参数
		var config;

		// 动作反馈
		var af = {};

		_public.init = function(cfg) {
			// 初始化参数
			config = Zepto.extend(true, {}, _static.config, cfg);

			if(config.stage) {
				page_scale_x = config.stage.offsetWidth / 140;
				page_scale_y = config.stage.offsetHeight / 60;
			}

			if (window.DeviceMotionEvent) {
				window.addEventListener('deviceorientation', deviceorientation, false);
			} else {
				alert("当前设备不支持deviceorientation");
			}
			if (window.DeviceMotionEvent) {
				window.addEventListener('devicemotion', devicemotion, false);
			} else {
				alert("当前设备不支持devicemotion");
			}
		}

		//位置响应
		var deviceorientation = function(e, callback) {

			var a = e.alpha;
			var b = e.beta;
			var g = e.gamma;
			a = a > 180 ? a - 360 : a;

			coor = {
				"a": a,
				"b": b,
				"g": g
			}

			//初始陀螺仪位置
			!ori && (ori = coor);

			//绑定元素
			config.target && _private.response[config.mode](config.target);

			//用户自定义函数
			config.callback();
		}

		//姿势响应
		var devicemotion = function(e) {

			gravity = e.accelerationIncludingGravity;
			cur_time = new Date().getTime();

			if ((cur_time - last_time) > config.sens) {
				var dur_time = cur_time - last_time; 

				var offset = {
					a: _private.getOffsetOri().a,
					b: _private.getOffsetOri().b,
					g: _private.getOffsetOri().g,
					x: _private.getOffsetGravity().x,
					y: _private.getOffsetGravity().y,
					z: _private.getOffsetGravity().z
				}

				// a面
				switch(true) {
					case offset.a > 10:
						// "左移";
						af.a = 1;
					break;
					case offset.a < -10:
						// "右移";
						af.a = 2;
					break;
					default:
						af.a = 0;
				}

				// b面
				switch(true) {
					case offset.b > 10:
						// "抬起";
						af.b = 1;
					break;
					case offset.b < -10:
						// "放下";
						af.b = 2;
					break;
					default:
						af.b = 0;

				}

				// g面
				switch(true) {
					// offset.a主要是用来防止平移时出现翻转判定
					case offset.g < -30 && offset.a > -15 && offset.b > -15:
						// "左翻";
						af.g = 1;
					break;
					case offset.g > 30 && offset.a < 15 && offset.b < 15:
						// "右翻";
						af.g = 2;
					break;
					default:
						af.g = 0;
				}

				// x轴
				switch(true) {
					case offset.x < -8:
						// "左甩";
						af.x = 1;
					break;
					case offset.x > 8:
						// "右甩";
						af.x = 2;
					break;
					default:
						af.x = 0;
				}

				// y轴
				switch(true) {
					case offset.y > 5:
						// "前甩";
						af.y = 1;
					break;
					case offset.y < -5:
						// "后甩";
						af.y = 2;
					break;
					default:
						af.y = 0;
				}

				// z轴
				switch(true) {
					case offset.z > 5:
						// "上甩";
						af.z = 1;
					break;
					case offset.z < -5:
						// "下甩";
						af.z = 2;
					break;
					default:
						af.z = 0;
				}


				last_time = cur_time;   

				last_gravity = gravity;
				last_coor = coor;  
			}
		}

		//获取陀螺仪变化量
		_private.getOffsetOri = function() {
			return {
				a: coor.a - last_coor.a,
				b: coor.b - last_coor.b,
				g: coor.g - last_coor.g
			}
		}

		//获取加速计变化量
		_private.getOffsetGravity = function() {
			return {
				x: gravity.x - last_gravity.x,
				y: gravity.y - last_gravity.y,
				z: gravity.z - last_gravity.z
			}
		}

		//实时响应
		_private.response = {
			//平移移动
			m1: function(node) {
				var left = config.ban == "x" ? 0 : (coor.a - ori.a) * page_scale_x + "px";
				var top = config.ban == "y" ? 0 : (coor.b - ori.b) * page_scale_y + "px";

				node.style['-webkit-transform'] = 'translate3d(' + left + ',' + top + ',0)';
				node.style['transform'] = 'translate3d(' + left + ',' + top + ',0)';
			},
			//翻转移动
			m2: function(node) {
				var left = config.ban == "x" ? 0 : (coor.g - ori.g) * page_scale_x + "px";
				var top = config.ban == "y" ? 0 :  (coor.b - ori.b) * page_scale_y + "px";

				node.style['-webkit-transform'] = 'translate3d(' + left + ',' + top + ',0)';
				node.style['transform'] = 'translate3d(' + left + ',' + top + ',0)';
			}
		}

		//事件绑定
		_public.connect = function() {
			window.addEventListener('deviceorientation', deviceorientation);
			window.addEventListener('devicemotion', devicemotion);
		}

		_public.disconnect = function() {
			window.removeEventListener('deviceorientation', deviceorientation);
			window.removeEventListener('devicemotion', devicemotion);
		}

		//重新设置初始陀螺仪状态
		_public.setOri = function() {
			ori = coor;
		}

		//获取初始陀螺仪状态
		_public.getOri = function() {
			return ori;
		}

		//获取陀螺仪以及加速计实时状态
		_public.getState = function() {
			var state = Zepto.extend(true, {}, coor, gravity);
			return state;
		}

		//获取陀螺仪动作反馈
		_public.getAction = function() {
			return af;
		}

	});
});
