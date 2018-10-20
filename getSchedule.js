function doPost(e) {
  const prop = PropertiesService.getScriptProperties().getProperties();
  if (prop.verificationToken != e.parameter.token) {
    throw new Error('Invalid token');
  }
  var command = e.parameter.text;
  var text = getEvents(command);
  var response = { text: text };

  var output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);

  return output;
}

function getEvents(command) {
  Logger.log("command: " + command);
  var name = command.split(' ')[0];
  var dateString = command.split(' ')[1];
  if (dateString != undefined) {
    var date = strToDate(dateString);
  } else {
    var date = new Date();
  }
  Logger.log("date: " + date);
  if (name.substr(0,1) == "@") {
    var userName = name.split('@')[1];
    var calendarId = getEmail(userName);
  }
  Logger.log("calendarId: " + calendarId);
  var calendar = CalendarApp.getCalendarById(calendarId);

  var events = calendar.getEventsForDay(date);
  var yyyymmdd = YYYYMMdd(date);
  var text = name + "さんの"　+ yyyymmdd + "の予定\n```";

  if (events.length == 0) {
    text += "なし";
  } else {
    for (var i=0; i<events.length;i++) {
      var title = events[i].getTitle();
      var startTime = HHmm(events[i].getStartTime());
      var endTime = HHmm(events[i].getEndTime());
      if (startTime == "00:00" && endTime == "00:00") {
        text += "\n終日: " + title;
      } else {
        text += "\n" + startTime + "〜" + endTime + ": " + title;
      }
    }
  }
  text += "\n```";
  Logger.log(text);

  return text
}

function getEmail(name) {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const slackApp = SlackApp.create(prop.token);
  const list = slackApp.usersList();
  const members = list["members"];

  for(i=0; i<members.length; i++) {
    if (members[i]["name"] == name) {
      Logger.log(members[i].name);
      return members[i].profile.email
    } else {
      continue;
    }
  }
}

function HHmm(str) {
  return Utilities.formatDate(str, 'JST', 'HH:mm');
}

function YYYYMMdd(str) {
  return Utilities.formatDate(str, 'JST', 'YYYY/MM/dd');
}

function strToDate(str) {
  var year = str.substr(0,4);
  var month = str.substr(4,2);
  var date = str.substr(6.2);
  return new Date(year + "-" + month + "-" + date);
}
