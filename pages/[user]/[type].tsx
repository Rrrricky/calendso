import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import prisma from "../../lib/prisma";
import { useRouter } from "next/router";
import dayjs, { Dayjs } from "dayjs";
import {
  ClockIcon,
  GlobeIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/solid";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

import { collectPageParameters, telemetryEventTypes, useTelemetry } from "../../lib/telemetry";
import AvailableTimes from "../../components/booking/AvailableTimes";
import TimeOptions from "../../components/booking/TimeOptions";
import Avatar from "../../components/Avatar";
import { timeZone } from "../../lib/clock";

export default function Type(props): Type {
  // Get router variables
  const router = useRouter();
  const { rescheduleUid } = router.query;

  // Initialise state
  const [selectedDate, setSelectedDate] = useState<Dayjs>();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [isTimeOptionsOpen, setIsTimeOptionsOpen] = useState(false);
  const [timeFormat, setTimeFormat] = useState("h:mma");
  const telemetry = useTelemetry();

  const minDay = parseInt(dayjs(props.eventType.startDate).format('D')) || null
  const maxDay = parseInt(dayjs(props.eventType.endDate).format('D')) || null
  const minMonth = parseInt(dayjs(props.eventType.startDate).format('MM')) - 1 || null
  const maxMonth = parseInt(dayjs(props.eventType.endDate).format('MM')) - 1 || null

  useEffect((): void => {
    telemetry.withJitsu((jitsu) => jitsu.track(telemetryEventTypes.pageView, collectPageParameters()));
  }, [telemetry]);

  // Handle month changes
  const incrementMonth = () => {
    setSelectedMonth(selectedMonth + 1);
  };

  const decrementMonth = () => {
    setSelectedMonth(selectedMonth - 1);
  };

  // Set up calendar
  const daysInMonth = dayjs().month(selectedMonth).daysInMonth();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Create placeholder elements for empty days in first week
  let weekdayOfFirst = dayjs().month(selectedMonth).date(1).day();
  if (props.user.weekStart === "Monday") {
    weekdayOfFirst -= 1;
    if (weekdayOfFirst < 0) weekdayOfFirst = 6;
  }
  const emptyDays = Array(weekdayOfFirst)
    .fill(null)
    .map((day, i) => (
      <div key={`e-${i}`} className={"text-center w-10 h-10 rounded-full mx-auto"}>
        {null}
      </div>
    ));

  const changeDate = (day): void => {
    telemetry.withJitsu((jitsu) => jitsu.track(telemetryEventTypes.dateSelected, collectPageParameters()));
    setSelectedDate(dayjs().month(selectedMonth).date(day));
  };

  const checkAvailableDays = (day) => {
    if (selectedMonth > minMonth && selectedMonth < maxMonth) {
      return true
    }
    else if (selectedMonth > minMonth && selectedMonth === maxMonth) {
      return day <= maxDay
    }
    else if (selectedMonth === minMonth && selectedMonth < maxMonth) {
      return day >= minDay
    }
    else if (selectedMonth === minMonth  && selectedMonth === maxMonth) {
      return day >= minDay && day <= maxDay
    }
    else {
      return false
    }
  }

  // Combine placeholder days with actual days
  const calendar = [
    ...emptyDays,
    ...days.map((day) => (
      <button
        key={day}
        onClick={() => changeDate(day)}
        disabled={selectedMonth < parseInt(dayjs().format('MM')) && dayjs().month(selectedMonth).format('D') > day || minDay !== null ? !checkAvailableDays(day) : '' } 
        className={"text-center w-10 h-10 rounded-full mx-auto " + (minDay === null ? dayjs().isSameOrBefore(dayjs().date(day).month(selectedMonth)) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-400 font-light' : checkAvailableDays(day) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-400 font-light') + (minDay !== null ? (day >= minDay && day <= maxDay && dayjs(selectedDate).month(selectedMonth).format("D") == day ? ' bg-blue-600 text-white-important' : '') : (dayjs(selectedDate).month(selectedMonth).format("D") == day ? ' bg-blue-600 text-white-important' : undefined))}>
        {day}
      </button>
    )),
  ];

  const handleSelectTimeZone = (selectedTimeZone: string): void => {
    if (selectedDate) {
      setSelectedDate(selectedDate.tz(selectedTimeZone));
    }
  };

  const handleToggle24hClock = (is24hClock: boolean): void => {
    if (selectedDate) {
      setTimeFormat(is24hClock ? "HH:mm" : "h:mma");
    }
  };

  return (
    <div>
      <Head>
        <title>
          {rescheduleUid && "Reschedule"} {props.eventType.title} | {props.user.name || props.user.username} |
          Calendso
        </title>
        <meta name="title" content={"Meet " + (props.user.name || props.user.username)  + " via Calendso"} />
        <meta name="description" content={props.eventType.description} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://calendso/" />
        <meta property="og:title" content={"Meet " + (props.user.name || props.user.username)  + " via Calendso"}/>
        <meta property="og:description" content={props.eventType.description}/>
        <meta property="og:image" content={"https://og-image-one-pi.vercel.app/" + encodeURIComponent("Meet **" + (props.user.name || props.user.username) + "** <br>" + props.eventType.description).replace(/'/g, "%27") + ".png?md=1&images=https%3A%2F%2Fcalendso.com%2Fcalendso-logo-white.svg&images=" + encodeURIComponent(props.user.avatar)} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://calendso/" /> 
        <meta property="twitter:title" content={"Meet " + (props.user.name || props.user.username)  + " via Calendso"} />
        <meta property="twitter:description" content={props.eventType.description} />
        <meta property="twitter:image" content={"https://og-image-one-pi.vercel.app/" + encodeURIComponent("Meet **" + (props.user.name || props.user.username) + "** <br>" + props.eventType.description).replace(/'/g, "%27") + ".png?md=1&images=https%3A%2F%2Fcalendso.com%2Fcalendso-logo-white.svg&images=" + encodeURIComponent(props.user.avatar)} /> 
            
      </Head>
      <main
        className={
          "mx-auto my-24 transition-max-width ease-in-out duration-500 " +
          (selectedDate ? "max-w-6xl" : "max-w-3xl")
        }>
        <div className="bg-white shadow rounded-lg">
          <div className="sm:flex px-4 py-5 sm:p-4">
            <div className={"pr-8 sm:border-r " + (selectedDate ? "sm:w-1/3" : "sm:w-1/2")}>
              <Avatar user={props.user} className="w-16 h-16 rounded-full mb-4" />
              <h2 className="font-medium text-gray-500">{props.user.name}</h2>
              <h1 className="text-3xl font-semibold text-gray-800 mb-4">{props.eventType.title}</h1>
              <p className="text-gray-500 mb-1 px-2 py-1 -ml-2">
                <ClockIcon className="inline-block w-4 h-4 mr-1 -mt-1" />
                {props.eventType.length} minutes
              </p>
              <button
                onClick={() => setIsTimeOptionsOpen(!isTimeOptionsOpen)}
                className="text-gray-500 mb-1 px-2 py-1 -ml-2">
                <GlobeIcon className="inline-block w-4 h-4 mr-1 -mt-1" />
                {timeZone()}
                <ChevronDownIcon className="inline-block w-4 h-4 ml-1 -mt-1" />
              </button>
              {isTimeOptionsOpen && (
                <TimeOptions
                  onSelectTimeZone={handleSelectTimeZone}
                  onToggle24hClock={handleToggle24hClock}
                />
              )}
              <p className="text-gray-600 mt-3 mb-8">{props.eventType.description}</p>
            </div>
            <div
              className={"mt-8 sm:mt-0 " + (selectedDate ? "sm:w-1/3 border-r sm:px-4" : "sm:w-1/2 sm:pl-4")}>
              <div className="flex text-gray-600 font-light text-xl mb-4 ml-2">
                <span className="w-1/2">{dayjs().month(selectedMonth).format("MMMM YYYY")}</span>
                <div className="w-1/2 text-right">
                  <button
                    onClick={decrementMonth}
                    className={"mr-4 " + (selectedMonth < parseInt(dayjs().format("MM")) && "text-gray-400")}
                    disabled={selectedMonth < parseInt(dayjs().format("MM"))}>
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={incrementMonth}
                    className={
                      minDay !== null &&
                      selectedMonth >= maxMonth &&
                        "text-gray-400"
                    }
                    disabled={minDay !== null && selectedMonth >= maxMonth}>
                      <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-4 text-center">
                {props.user.weekStart !== "Monday" ? (
                  <div className="uppercase text-gray-400 text-xs tracking-widest">Sun</div>
                ) : null}
                <div className="uppercase text-gray-400 text-xs tracking-widest">Mon</div>
                <div className="uppercase text-gray-400 text-xs tracking-widest">Tue</div>
                <div className="uppercase text-gray-400 text-xs tracking-widest">Wed</div>
                <div className="uppercase text-gray-400 text-xs tracking-widest">Thu</div>
                <div className="uppercase text-gray-400 text-xs tracking-widest">Fri</div>
                <div className="uppercase text-gray-400 text-xs tracking-widest">Sat</div>
                {props.user.weekStart === "Monday" ? (
                  <div className="uppercase text-gray-400 text-xs tracking-widest">Sun</div>
                ) : null}
                {calendar}
              </div>
            </div>
            {selectedDate && (
              <AvailableTimes
                timeFormat={timeFormat}
                user={props.user}
                eventType={props.eventType}
                date={selectedDate}
              />
            )}
          </div>
        </div>
        {/* note(peer):
          you can remove calendso branding here, but we'd also appreciate it, if you don't <3
        */}
        <div className="text-xs text-right pt-1">
          <Link href="https://calendso.com">
            <a style={{ color: "#104D86" }} className="opacity-50 hover:opacity-100">
              powered by{" "}
              <img
                style={{ top: -2 }}
                className="w-auto inline h-3 relative"
                src="/calendso-logo-word.svg"
                alt="Calendso Logo"
              />
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
    const user = await prisma.user.findFirst({
        where: {
          username: context.query.user,
        },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bio: true,
            avatar: true,
            eventTypes: true,
            startTime: true,
            timeZone: true,
            endTime: true,
            weekStart: true,
        }
    });

    const subEventTypes = user.eventTypes.map(el => {
      if (el.startDate !== null) {
        return {
          startDate: el.startDate.toString(),
          endDate: el.endDate.toString(),
        }
      }
      else {
        return { 
          startDate: el.startDate,
          endDate: el.endDate,
        }
      }
    })

    const userObj = Object.assign({}, user, {
      eventTypes: subEventTypes
    })

    if (!user) {
      return {
        notFound: true,
      };
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug: {
          equals: context.query.type,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        length: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!eventType) {
      return {
        notFound: true,
      };
    }

    // Workaround since Next.js has problems serializing date objects (see https://github.com/vercel/next.js/issues/11993)
    const eventTypeObj = Object.assign({}, eventType, {
      startDate: eventType.startDate !== null ? eventType.startDate.toString() : eventType.startDate,
      endDate: eventType.endDate !== null ? eventType.endDate.toString() : eventType.endDate,
    });

    return {
      props: {
        user: userObj,
        eventType: eventTypeObj
      },
    };
};
