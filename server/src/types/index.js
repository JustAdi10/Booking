"use strict";
// Core type definitions for the Cricket Ground & Room Booking System
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = exports.NotificationPriority = exports.NotificationType = exports.MealType = exports.HousekeepingTaskStatus = exports.TaskPriority = exports.HousekeepingTaskType = exports.BookingStatus = exports.BookingType = exports.RoomType = exports.FacilityType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["HOUSEKEEPING"] = "HOUSEKEEPING";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var FacilityType;
(function (FacilityType) {
    FacilityType["GROUND"] = "GROUND";
    FacilityType["BUILDING"] = "BUILDING";
})(FacilityType || (exports.FacilityType = FacilityType = {}));
var RoomType;
(function (RoomType) {
    RoomType["SINGLE"] = "SINGLE";
    RoomType["DOUBLE"] = "DOUBLE";
    RoomType["SUITE"] = "SUITE";
    RoomType["DORMITORY"] = "DORMITORY";
})(RoomType || (exports.RoomType = RoomType = {}));
var BookingType;
(function (BookingType) {
    BookingType["GROUND"] = "GROUND";
    BookingType["ROOM"] = "ROOM";
})(BookingType || (exports.BookingType = BookingType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var HousekeepingTaskType;
(function (HousekeepingTaskType) {
    HousekeepingTaskType["CLEANING"] = "CLEANING";
    HousekeepingTaskType["MAINTENANCE"] = "MAINTENANCE";
    HousekeepingTaskType["INSPECTION"] = "INSPECTION";
})(HousekeepingTaskType || (exports.HousekeepingTaskType = HousekeepingTaskType = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var HousekeepingTaskStatus;
(function (HousekeepingTaskStatus) {
    HousekeepingTaskStatus["PENDING"] = "PENDING";
    HousekeepingTaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    HousekeepingTaskStatus["COMPLETED"] = "COMPLETED";
    HousekeepingTaskStatus["NEEDS_REPAIR"] = "NEEDS_REPAIR";
})(HousekeepingTaskStatus || (exports.HousekeepingTaskStatus = HousekeepingTaskStatus = {}));
var MealType;
(function (MealType) {
    MealType["BREAKFAST"] = "BREAKFAST";
    MealType["LUNCH"] = "LUNCH";
    MealType["DINNER"] = "DINNER";
    MealType["SNACKS"] = "SNACKS";
})(MealType || (exports.MealType = MealType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING"] = "BOOKING";
    NotificationType["HOUSEKEEPING"] = "HOUSEKEEPING";
    NotificationType["MEAL"] = "MEAL";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var Platform;
(function (Platform) {
    Platform["WEB"] = "WEB";
    Platform["IOS"] = "IOS";
    Platform["ANDROID"] = "ANDROID";
})(Platform || (exports.Platform = Platform = {}));
