
const logger = require('@geek/logger').createLogger('@titanium-calendar-picker', { meta: { filename: __filename } });
// const moment = require('moment');

const previously_selected_dates = _.clone($.args.selectedDates);
const selected_dates = _.clone(previously_selected_dates);
const blocked_dates = _.clone($.args.blockedDates);

$.start_moment = moment($.args.startDate, $.args.dateFormat);
$.end_moment = moment($.args.endDate,  $.args.dateFormat);

$.main.top = $.args.top;
$.main.bottom = $.args.bottom;
$.main.left = $.args.left;
$.main.right = $.args.right;

$.getRemovedDates = () => {
	return _.difference(previously_selected_dates, selected_dates);
};

$.getAddedDates = () => {
	return _.difference(selected_dates, previously_selected_dates);
};

let current_page = 0;

function getDayLabels() {
	const days = moment.weekdaysShort(true);
	_.each(days, day => {
		const view = turbo.createView({
			height: Ti.UI.Fill,
			width:  Math.floor($.calendar.rect.width / 7),
		});
		view.add(
			turbo.createLabel({
				left:  5,
				text:  day,
				color: '#fafafa',
			}),
		);

		$.dayLabelsRow.add(view);
	});
}

function createDayView(number, year_day) {
	const isBlocked = _.contains(blocked_dates, year_day) && ! _.contains(previously_selected_dates, year_day);

	const day_view = turbo.createView({
		width:           Math.floor($.calendar.rect.width / 7),
		backgroundColor: $.args.blockedBackgroundColor,
		borderColor:     $.args.blockedBorderColor,
		opacity:         1,
		height:          Ti.UI.FILL,
		layout:          'composite',
		isBlocked:       isBlocked,
		year_day,
		borderWidth:     1,
	});

	day_view.add(
		turbo.createLabel({
			color:        $.args.blockedTextColor,
			text:         number,
			touchEnabled: false,
			top:          3,
			left:         5,
			fontFamily:   'SFProDisplay-Bold',
			fontSize:     13,
		}),
	);

	day_view.add(
		turbo.createView({
			height:          6,
			width:           6,
			borderRadius:    3,
			top:             23,
			left:            5,
			touchEnabled:    false,
			backgroundColor: 'transparent',
		}),
	);

	if (isBlocked) {
		day_view.add(
			turbo.createIcon({
				type:         'solid',
				name:         'times-circle',
				size:         16,
				color:        $.args.blockedTextColor,
				visible:      true,
				touchEnabled: false,
				bottom:       12,
			}),
		);
	} else {
		day_view.add(
			turbo.createIcon({
				type:         'solid',
				name:         'check-circle',
				size:         16,
				color:        $.args.selectedTextColor,
				visible:      false,
				touchEnabled: false,
				bottom:       12,
			}),
		);
	}

	return day_view;
}

const toggleSelected = view => {
	if (view.isActive) {
		if (view.isSelected) {
			_.pull(selected_dates, view.year_day);
		} else {
			selected_dates.push(view.year_day);
		}

		view.isSelected = !view.isSelected;
		updateDayView(view);

		$.trigger('changed');

		logger.debug(`🦠  selected_dates: ${JSON.stringify(selected_dates, null, 2)}`);
		logger.debug(`🦠  $.getRemovedDates(): ${JSON.stringify($.getRemovedDates(), null, 2)}`);
		logger.debug(`🦠  $.getAddedDates(): ${JSON.stringify($.getAddedDates(), null, 2)}`);
	}
};

const updateDayView = view => {

	if (!view.isBlocked && !view.isActive) {
		view.backgroundColor = $.args.inactiveBackgroundColor;
		view.borderColor = $.args.inactiveBackgroundColor;
		view.children[0].color = $.args.inactiveTextColor;
	} else if (view.isSelected) {
		view.backgroundColor = $.args.selectedBackgroundColor;
		view.borderColor = $.args.selectedBorderColor;
		view.children[0].color = $.args.selectedTextColor;
		view.children[2].visible = true;
	} else if (!view.isBlocked) {
		view.backgroundColor = $.args.unselectedBackgroundColor;
		view.borderColor = $.args.unselectedBorderColor;
		view.children[0].color = $.args.unselectedTextColor;
		view.children[2].visible = false;
	}

	if (view.isToday) {
		view.borderColor = $.args.todayBorderColor;
		view.borderWidth = 4;
	}
};

function getMonthView(calendar_month) {
	const month_view = turbo.createView({
		month:           calendar_month.month,
		year:            calendar_month.year,
		backgroundColor: $.args.backgroundColor,
		ready:           false,
		width:           Ti.UI.FILL,
		height:          Ti.UI.SIZE,
		layout:          'vertical',
	});

	return month_view;
}

function updateMonthView(calendar_index) {
	logger.track(`📌  you are here → calendar-picker.updateMonthView(${calendar_index})`);

	if (calendar_index < 0 || calendar_index >= calendar.length) {
		logger.track(`📌  you are here → calendar_index is out of range: ${calendar_index}`);
		return;
	}

	const calendar_month = calendar[calendar_index];
	const month_view = $.monthScroll.views[calendar_index];
	if (month_view.ready) {
		return;
	}
	const month_rows = [];
	const num_cols = 7;
	const num_rows = 5;

	for (let i = 0; i < num_rows; i++) {
		month_rows.push(
			turbo.createHorizontal({
				width:  Ti.UI.SIZE,
				height: 50,
			}),
		);
	}

	// Add day containers
	for (let d = 0; d < num_rows * num_cols; d++) {
		const current_day = moment(calendar_month.first_date.clone()).add(d, 'days');
		const current_year_day = _.toInteger(current_day.format($.args.dateFormat));
		const current_view = createDayView(current_day.date(), current_year_day);
		// current_view.year_day = current_year_day;
		current_view.date = current_day;
		current_view.children[0].text = current_day.date();
		current_view.isSelected = _.includes(selected_dates, current_year_day);
		current_view.isActive = (current_view.isSelected || !current_view.isBlocked)
			&& current_day.month() === month_view.month
			&& current_day.isBetween($.start_moment, $.end_moment, undefined, '[]');
		current_view.isToday = current_day.isSame(moment(), 'day');
		updateDayView(current_view);

		current_view.isActive
			&& current_view.addEventListener('click', e => {
				logger.track('📌  you are here → calendar-picker.onClick');
				toggleSelected(e.source);
			});

		month_rows[Math.floor(d / num_cols)].add(current_view);
	}

	// Add rows
	_.each(month_rows, row => {
		month_view.add(row);
	});

	month_view.ready = true;
}

const calendar = [];

function buildCalendar() {
	$.main.removeEventListener('postlayout', buildCalendar);

	// Add top labels
	getDayLabels();
	let building = true;
	const current_moment = $.start_moment.clone();

	while (building) {
		const calendar_month = {
			title:       current_moment.format('MMMM YYYY'),
			short_title: current_moment.format('MMM[\n]YYYY'),
			start_date:  current_moment.clone().startOf('month').startOf('week'),
			first_date:  current_moment.clone().startOf('month').startOf('week'),
			month:       current_moment.month(),
			year:        current_moment.year(),
		};

		$.monthScroll.addView(getMonthView(calendar_month));
		calendar.push(calendar_month);
		current_moment.add(1, 'M');
		building = current_moment.isSameOrBefore($.end_moment.clone().endOf('month'));
	}

	setCurrentMonth(0);
}

function setCurrentMonth(calendar_index) {
	logger.track(`📌  you are here → setCurrentMonth(${calendar_index})`);

	$.monthScroll.currentPage = calendar_index;
	$.monthName.text = calendar[calendar_index].title;
	updateMonthView(calendar_index);

	$.previous.text = calendar_index > 0 ? calendar[calendar_index - 1].short_title : '';
	$.previous_button.visible = calendar_index > 0;

	$.next.text = calendar_index < calendar.length - 1 ? calendar[calendar_index + 1].short_title : '';
	$.next_button.visible = calendar_index < calendar.length - 1;

	updateMonthView(calendar_index + 1);
	updateMonthView(calendar_index - 1);
}

$.main.addEventListener('postlayout', buildCalendar);

$.monthScroll.addEventListener('scroll', e => {
	if (e.currentPage === current_page) {
		return;
	}
	// const old_page = current_page;
	// logger.debug(`🦠  old_page: ${JSON.stringify(old_page, null, 2)}`);
	current_page = e.currentPage;

	// logger.debug(`🦠  current_page: ${JSON.stringify(current_page, null, 2)}`);

	setCurrentMonth(current_page);
});
