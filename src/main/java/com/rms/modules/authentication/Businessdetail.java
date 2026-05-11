//package com.golddekho.modules.authentication;
//
//import com.fasterxml.jackson.annotation.JsonProperty;
//import lombok.Getter;
//import lombok.Setter;
//
//@Getter
//@Setter
//public class Businessdetail {
//
//    private String userType;         // User ka type, mandatory ya optional, backend me set karenge
//    private String category;         // User category (retail, distributor, etc.)
//    private String shopName;         // Shop ka naam
//    private String street;           // Address street
//    private String landmark;         // Address landmark
//    
//    // ✅ UPDATED: Support for both old and new formats
//    private Integer city;               // Direct city ID (backward compatibility)
//    private Integer state;              // Direct state ID (backward compatibility)
//    
//    // ✅ NEW: Foreign key objects
//    private CityId cityId;           // For new format: {"cityId": {"id": 1}}
//    private StateId stateId;         // For new format: {"stateId": {"id": 1}}
//    
//    private String pincode;          // User-provided pincode
//    private String email;            // Optional, backend overwrite nahi karega
//    private String latitude;         // Optional
//    private String longitude;        // Optional
//    
//    @JsonProperty("parentCode")
//    private String parentCode;       // Parent code from token / optional
//
//    // Optional / future expansion
//    private String authorisedName;   // UsersEntity.authorisedName
//    private String brandName;        // UsersEntity.brandName
//    private String legalName;        // UsersEntity.legalName
//    private String companyCIN;       // UsersEntity.companyCin
//    private String gstNumber;        // UsersEntity.gstNumber
//
//    // ✅ NEW: Inner classes for foreign key objects
//    @Getter
//    @Setter
//    public static class CityId {
//        private Integer id;
//    }
//
//    @Getter
//    @Setter
//    public static class StateId {
//        private Integer id;
//    }
//}
////package com.golddekho.modules.authentication;
////
////import com.fasterxml.jackson.annotation.JsonProperty;
////import lombok.Getter;
////import lombok.Setter;
////
////@Getter
////@Setter
////public class Businessdetail {
////
////    private String userType;         // User ka type, mandatory ya optional, backend me set karenge
////    private String category;         // User category (retail, distributor, etc.)
////    private String shopName;         // Shop ka naam
////    private String street;           // Address street
////    private String landmark;         // Address landmark
////    private String city;             // User-provided city (backend Pincode resolve use nahi karega)
////    private String state;            // User-provided state (same as above)
////    private String pincode;          // User-provided pincode
////    private String email;            // Optional, backend overwrite nahi karega
////    private String latitude;         // Optional
////    private String longitude;        // Optional
////    @JsonProperty("parentCode")
////    private String parentCode;       // Parent code from token / optional
////
////    // Optional / future expansion
////    private String authorisedName;   // UsersEntity.authorisedName
////    private String brandName;        // UsersEntity.brandName
////    private String legalName;        // UsersEntity.legalName
////    private String companyCIN;       // UsersEntity.companyCin
////    private String gstNumber;        // UsersEntity.gstNumber
////}
