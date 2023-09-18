module.exports = {
	//----------------------------------------------------------------------------------//
	// 地圖計算
	//----------------------------------------------------------------------------------//
	// 地球半徑(m)
	earthRadiusMeters: 6371000.0,
	// 角度 -> 弧度
	radiansPerDegree: Math.PI / 180.0,
	// 弧度 -> 角度
	degreesPerRadian: 180.0 / Math.PI,

	/**
	 * 計算距離
	 * @param {{lat: number, lng: number}} start 
	 * @param {{lat: number, lng: number}} end 
	 * @returns {number}
	 */
	calcDistance: function (start, end) {
		const dLat = module.exports.radiansPerDegree * (end.lat - start.lat);
		const dLng = module.exports.radiansPerDegree * (end.lng - start.lng);
		const sLat = module.exports.radiansPerDegree * (start.lat);
		const eLat = module.exports.radiansPerDegree * (end.lat);

		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(sLat) * Math.cos(eLat);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = module.exports.earthRadiusMeters * c;
		return distance;
	},

	/**
 * 計算與 經度0(Ｙ軸) 夾角
 * @param {{lat: number, lng: number}} start 
 * @param {{lat: number, lng: number}} end 
 * @returns {number}
 */
	calBearing: function (start, end) {
		const dLng = module.exports.radiansPerDegree * (end.lng - start.lng);
		const sLat = module.exports.radiansPerDegree * start.lat;
		const eLat = module.exports.radiansPerDegree * end.lat;

		const diff_x = Math.cos(sLat) * Math.sin(eLat) - Math.sin(sLat) * Math.cos(eLat) * Math.cos(dLng); //x
		const diff_y = Math.sin(dLng) * Math.cos(eLat);  // y

		// 返回角度,不是弧度
		let angle = Math.atan2(diff_y, diff_x);
		if (angle < 0) angle += 360;

		return angle * module.exports.degreesPerRadian;
	},

	/**
 * 計算三點夾角
 * @param {{lat: number, lng: number}} point1
 * @param {{lat: number, lng: number}} point2
 * @param {{lat: number, lng: number}} point3
 * @returns {number}
 */
	calAngle: function (point1, point2, point3) {
		const bearing21 = module.exports.calBearing(point2, point1);
		const bearing23 = module.exports.calBearing(point2, point3);
		let angle = bearing21 - bearing23;
		if (angle < 0) angle += 360;

		return angle;
	},

	/**
 * 計算兩向量夾角
 * @param {{lat: number, lng: number}} vector1
 * @param {{lat: number, lng: number}} vector2
 * @returns {number}
 */
	calVecAngle: function (vector1, vector2) {
		const dot = vector1.lng * vector2.lng + vector1.lat * vector2.lat;
		const det = vector1.lng * vector2.lng - vector1.lat * vector2.lat;
		let angle = Math.atan2(det, dot) / Math.PI * 180;
		if (angle < 0) angle += 360;
		return angle;
	},

	/**
	 * 計算面積
	 * @param {Array<number[]>} points 
	 * @returns {number}
	 */
	calArea: function (points) {
		let area = 0;
		if (points.length > 2) {
			area = module.exports.PlanarPolygonArea(points);
			if (area > 1000000.0) {
				area = module.exports.SphericalPolygonArea(points);
			}
		}
		return area;
	},

	/**
	 * 球面多邊形面積計算
	 * @param {Array<number[]>} points 
	 * @returns {number}
	 */
	SphericalPolygonArea: function (points) {
		const totalAngle = 0;
		for (let i = 0; i < points.length; i++) {
			const j = (i + 1) % points.length;
			const k = (i + 2) % points.length;
			totalAngle += module.exports.calAngle(points[i], points[j], points[k]);
		}
		const planarTotalAngle = (points.length - 2) * 180.0;
		const sphericalExcess = totalAngle - planarTotalAngle;
		if (sphericalExcess > 420.0) {
			totalAngle = points.length * 360.0 - totalAngle;
			sphericalExcess = totalAngle - planarTotalAngle;
		} else if (sphericalExcess > 300.0 && sphericalExcess < 420.0) {
			sphericalExcess = Math.abs(360.0 - sphericalExcess);
		}
		return sphericalExcess * module.exports.radiansPerDegree * module.exports.earthRadiusMeters * module.exports.earthRadiusMeters;
	},

	/**
	 * 平面多邊形面積
	 * @param {Array<number[]>} points 
	 * @returns {number}
	 */
	PlanarPolygonArea: function (points) {
		const metersPerDegree = 2.0 * Math.PI * module.exports.earthRadiusMeters / 360.0;
		var a = 0;
		for (var i = 0; i < points.length; ++i) {
			var j = (i + 1) % points.length;
			var xi = points[i][0] * metersPerDegree * Math.cos(module.exports.radiansPerDegree * points[i][1]);
			var yi = points[i][1] * metersPerDegree;
			var xj = points[j][0] * metersPerDegree * Math.cos(module.exports.radiansPerDegree * points[j][1]);
			var yj = points[j][1] * metersPerDegree;
			a += xi * yj - xj * yi;
		}
		return Math.abs(a / 2);
	},

	//----------------------------------------------------------------------------------//
	// 工具
	//----------------------------------------------------------------------------------//
	/**
	 * 解析csv
	 * @param {string} str 
	 * @param {string} delimiter 
	 * @returns {string}
	 */
	csvToArray: function (str, delimiter = ",") {
		const headers = str.slice(0, str.indexOf("\n")).split(delimiter).map(header => header.replace(/\r\n/g, '').trim());
		const rows = str.slice(str.indexOf("\n") + 1).split("\n");
		const regex = /("[^"]+"|[^,]+)*,/g;

		const result = rows.map(row => {
			const values = row.split(regex).filter(row => row == undefined || row.length != 0).map(row => {
				if (row == undefined) return row = '';
				else return row.replace(/\r\n|\"/g, '').trim();
			});

			return headers.reduce((object, header, index) => {
				object[header] = values[index];
				return object;
			}, {});
		});

		return result
	},
}
