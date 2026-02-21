/**
 * Core services module exports
 */

module.exports = {
  BaseService: require('./BaseService'),
  AuthService: require('./AuthService'),
  CaseService: require('./CaseService'),
  DoctorService: require('./DoctorService'),
  PatientService: require('./PatientService'),
  NotificationService: require('./NotificationService'),
  HospitalService: require('./HospitalService'),
  MessageService: require('./MessageService'),
  CacheService: require('./CacheService'),
  CacheInvalidation: require('./CacheInvalidation'),
  ValidationService: require('./ValidationService')
};
