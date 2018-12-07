function doPost(e) {
  const prop = PropertiesService.getScriptProperties().getProperties();
  if (prop.verificationToken != e.parameter.token) {
    throw new Error('Invalid token');
  }
  var requestText = e.parameter.text;
  var text = makeResponseText(requestText);
  var response = { text: text };

  var output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);

  return output;
}

function makeResponseText(text) {
  Logger.log("text: " + text);

  // textからカレンダーIDを取得
  var name = text.split(' ')[0];
  if (name.substr(0,1) == "@") {
    var userName = name.split('@')[1];
    var calendarId = getEmail(userName);
  }
  Logger.log("calendarId: " + calendarId);
  var calendar = CalendarApp.getCalendarById(calendarId);

  // textから日付を取得
  var dateString = text.split(' ')[1];
  if (dateString != undefined) {
    var date = strToDate(dateString);
  } else {
    var date = new Date();
  }
  Logger.log("date: " + date);

  var events = calendar.getEventsForDay(date);

  // Slack用のテキストを整形
  var yyyymmdd = YYYYMMdd(date);
  var responseText = name + "さんの"　+ yyyymmdd + "の予定\n```";
  if (events.length == 0) {
    responseText += "なし";
  } else {
    for (var i=0; i<events.length;i++) {
      var title = events[i].getTitle();
      var startTime = HHmm(events[i].getStartTime());
      var endTime = HHmm(events[i].getEndTime());
      if (startTime == "00:00" && endTime == "00:00") {
        responseText += "\n終日: " + title;
      } else {
        responseText += "\n" + startTime + "〜" + endTime + ": " + title;
      }
    }
  }
  responseText += "\n```";
  Logger.log(responseText);
  return responseText
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
