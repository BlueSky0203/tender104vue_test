import moment from 'moment'

export function pickerOptions(shortcutType = 'year', dateStart, hasWeek = true, disabledDate = true) {
	const shortcutDetail = {
		TODAY: {
			key: "TODAY",
			text: "今日",
			disabled: false,
			onClick(picker) {
				const end = moment().endOf("d");
				const start = moment().startOf("d");
				picker.$emit("pick", [start, end]);
			},
		},
		YESTERDAY: {
			key: "YESTERDAY",
			text: "昨日",
			disabled: false,
			onClick(picker) {
				const end = moment().endOf("d").subtract(1, "d");
				const start = moment().startOf("d").subtract(1, "d");
				picker.$emit("pick", [start, end]);
			},
		},
		THIS_WEEK: {
			key: "THIS_WEEK",
			text: "本週",
			disabled: !hasWeek,
			onClick(picker) {
				let offset = moment().day() != 0 ? 0 : 1;
				const end = moment().subtract(0 + offset, "w").day(7).endOf("d");
				const start = moment().subtract(0 + offset, "w").day(1).startOf("d");
				picker.$emit("pick", [start, end]);
			},
		},
		LAST_WEEK: {
			key: "LAST_WEEK",
			text: "上週",
			disabled: !hasWeek,
			onClick(picker) {
				let offset = moment().day() != 0 ? 0 : 1;
				const end = moment().subtract(1 + offset, "w").day(7).endOf("d");
				const start = moment().subtract(1 + offset, "w").day(1).startOf("d");
				picker.$emit("pick", [start, end]);
			},
		},
		THIS_MONTH: {
			key: "THIS_MONTH",
			text: "本月",
			disabled: false,
			onClick(picker) {
				const end = moment().endOf("month");
				const start = moment().startOf("month");
				picker.$emit("pick", [start, end]);
			},
		},
		LAST_MONTH: {
			key: "LAST_MONTH",
			text: "上月",
			disabled: false,
			onClick(picker) {
				const end = moment().subtract(1, "month").endOf("month");
				const start = moment().subtract(1, "month").startOf("month");
				picker.$emit("pick", [start, end]);
			},
		},
		THIS_YEAR:{
			key: "THIS_YEAR",
			text: "今年",
			disabled: false,
			onClick(picker) {
				const end = moment().endOf("year");
				const start = moment().startOf("year");
				picker.$emit("pick", [start, end]);
			},
		}
	};

	const shortcutList = {
		day: [ 'TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH' ],
		year: [ 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR' ]
	};

	// console.log(shortcutType, shortcutList[shortcutType]);

	let pickerOptions =
	{
		firstDayOfWeek: 1,
		shortcuts: Object.keys(shortcutDetail).filter(key => shortcutList[shortcutType].includes(key)).map(key => shortcutDetail[key]),
		disabledDate(date) {
			if (dateStart != undefined) return moment(date).valueOf() < moment(dateStart).startOf("d").valueOf() || moment(date).valueOf() >= moment().endOf("d").valueOf();
			else return moment(date).valueOf() >= moment().endOf("d").valueOf();
		},
	}

	if (!disabledDate) delete pickerOptions.disabledDate;

	pickerOptions.shortcuts = pickerOptions.shortcuts.filter(s => !s.disabled);

	return pickerOptions
}

export function dateWatcher(dateStart, dateRange) {
	if (moment(dateRange[1]).isAfter(moment())) dateRange[1] = moment().endOf("d").toDate();
	if (moment(dateRange[0]).isAfter(dateRange[1])) dateRange[0] = dateRange[1];
	if (dateStart != undefined) {
		const start = moment(dateStart).startOf("d").valueOf();
		if (moment(dateRange[0]).isBefore(start)) dateRange[0] = start;
	} 
}

export function dateShortcuts(index, shortcutType = 'year', dateStart, hasWeek = true) {
	const DATE_OPTION = {
		TODAY: -1,
		YESTERDAY: -1,
		THIS_WEEK: -1,
		LAST_WEEK: -1,
		THIS_MONTH: -1,
		LAST_MONTH: -1,
		THIS_YEAR: -1
	}

	const shortcuts = pickerOptions(shortcutType, dateStart, hasWeek).shortcuts;
	shortcuts.forEach((option, index) => DATE_OPTION[option.key] = index);

	const offsetWeek = moment().day() != 0 ? 0 : 1;

	// this.timeTabId = index;
	switch (index) {
		case DATE_OPTION.TODAY:
			return [moment().startOf("d"), moment().endOf("d")];
			break;
		case DATE_OPTION.YESTERDAY:
			return [moment().startOf("d").subtract(1, "d"), moment().endOf("d").subtract(1, "d")]
			break;
		case DATE_OPTION.THIS_WEEK:
			return [moment().subtract(0 + offsetWeek, "w").day(1).startOf("d"), moment().subtract(0 + offsetWeek, "w").day(7).endOf("d")]
			break;
		case DATE_OPTION.LAST_WEEK:
			return [moment().subtract(1 + offsetWeek, "w").day(1).startOf("d"), moment().subtract(1 + offsetWeek, "w").day(7).endOf("d")]
			break;
		case DATE_OPTION.THIS_MONTH:
			return [moment().startOf("month"), moment().endOf("month")]
			break;
		case DATE_OPTION.LAST_MONTH:
			return [moment().subtract(1, "month").startOf("month"), moment().subtract(1 , "month").endOf("month")]
			break;
		case DATE_OPTION.THIS_YEAR:
			return [moment().startOf("year"), moment().endOf("year")]
			break;
	}
}