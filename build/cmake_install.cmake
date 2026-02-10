# Install script for directory: C:/my-note-app/poppler-25.12.0/share/poppler

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "C:/Program Files (x86)/poppler-data")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Debug")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "FALSE")
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/Big5;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/Big5ascii;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/EUC-CN;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/EUC-JP;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/GBK;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-2022-CN;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-2022-JP;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-2022-KR;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-8859-6;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-8859-7;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-8859-8;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/ISO-8859-9;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/KOI8-R;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/Latin2;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/Shift-JIS;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/TIS-620;C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap/Windows-1255")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/unicodeMap" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/Big5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/Big5ascii"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/EUC-CN"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/EUC-JP"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/GBK"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-2022-CN"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-2022-JP"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-2022-KR"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-8859-6"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-8859-7"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-8859-8"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/ISO-8859-9"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/KOI8-R"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/Latin2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/Shift-JIS"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/TIS-620"
    "C:/my-note-app/poppler-25.12.0/share/poppler/unicodeMap/Windows-1255"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-0;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-1;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-3;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-4;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-6;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-7;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-B5pc;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-ETen-B5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-CID;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-Host;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-Mac;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5pc-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5pc-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5pc-UCS2C;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5pc-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS1-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS1-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/CNS-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETen-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETen-B5-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETen-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETenms-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETenms-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETHK-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/ETHK-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKdla-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKdla-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKdlb-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKdlb-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKgccs-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKgccs-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKm314-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKm314-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKm471-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKm471-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKscs-B5-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/HKscs-B5-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UCS2-B5pc;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UCS2-ETen-B5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UCS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF8-V")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-CNS1" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-0"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-3"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-4"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-6"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-7"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-B5pc"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-ETen-B5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-CID"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-Host"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-H-Mac"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/Adobe-CNS1-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5pc-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5pc-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5pc-UCS2C"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5pc-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS1-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS1-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/CNS-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETen-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETen-B5-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETen-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETenms-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETenms-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETHK-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/ETHK-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKdla-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKdla-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKdlb-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKdlb-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKgccs-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKgccs-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKm314-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKm314-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKm471-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKm471-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKscs-B5-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/HKscs-B5-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UCS2-B5pc"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UCS2-ETen-B5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UCS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-CNS1/UniCNS-UTF8-V"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-0;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-1;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-3;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-4;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-GBK-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-GBpc-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-CID;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-Host;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-Mac;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/Adobe-GB1-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GB-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GB-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GB-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBK2K-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBK2K-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBK-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBK-EUC-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBK-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBKp-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBKp-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBpc-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBpc-EUC-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBpc-EUC-UCS2C;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBpc-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBT-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBT-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBT-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBTpc-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBTpc-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GBT-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/GB-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UCS2-GBK-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UCS2-GBpc-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UCS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1/UniGB-UTF8-V")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-GB1" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-0"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-3"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-4"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-GBK-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-GBpc-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-CID"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-Host"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-H-Mac"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/Adobe-GB1-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GB-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GB-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GB-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBK2K-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBK2K-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBK-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBK-EUC-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBK-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBKp-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBKp-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBpc-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBpc-EUC-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBpc-EUC-UCS2C"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBpc-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBT-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBT-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBT-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBTpc-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBTpc-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GBT-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/GB-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UCS2-GBK-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UCS2-GBpc-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UCS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-GB1/UniGB-UTF8-V"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78ms-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78ms-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/78-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/83pv-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90msp-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90msp-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-UCS2C;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Add-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Add-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Add-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Add-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-0;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-1;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-3;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-4;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-6;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-7;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-90ms-RKSJ;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-90pv-RKSJ;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-CID;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-Host;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-Mac;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-PS-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-PS-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Ext-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Ext-RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Ext-RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Ext-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hankaku;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hiragana;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hojo-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hojo-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hojo-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Hojo-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Katakana;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/NWP-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/NWP-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/RKSJ-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/RKSJ-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/Roman;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UCS2-90ms-RKSJ;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UCS2-90pv-RKSJ;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UCS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF8-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF8-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISPro-UCS2-HW-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISPro-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISPro-UTF8-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-HW-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-HW-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF8-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISX02132004-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISX02132004-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISX0213-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/UniJISX0213-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1/WP-Symbol")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan1" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78ms-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78ms-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/78-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/83pv-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90msp-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90msp-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90ms-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-UCS2C"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/90pv-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Add-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Add-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Add-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Add-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-0"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-3"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-4"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-6"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-7"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-90ms-RKSJ"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-90pv-RKSJ"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-CID"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-Host"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-H-Mac"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-PS-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-PS-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Adobe-Japan1-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Ext-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Ext-RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Ext-RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Ext-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hankaku"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hiragana"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hojo-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hojo-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hojo-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Hojo-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Katakana"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/NWP-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/NWP-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/RKSJ-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/RKSJ-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/Roman"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UCS2-90ms-RKSJ"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UCS2-90pv-RKSJ"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UCS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniHojo-UTF8-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS2004-UTF8-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISPro-UCS2-HW-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISPro-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISPro-UTF8-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-HW-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-HW-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJIS-UTF8-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISX02132004-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISX02132004-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISX0213-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/UniJISX0213-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan1/WP-Symbol"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan2/Adobe-Japan2-0")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Japan2" TYPE FILE FILES "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Japan2/Adobe-Japan2-0")
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-0;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-1;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-CID;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-Host;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-Mac;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-KSCms-UHC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-KSCpc-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-Johab-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-Johab-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-HW-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-HW-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-UCS2C;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/KSC-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UCS2-KSCms-UHC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UCS2-KSCpc-EUC;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UCS2-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UCS2-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF16-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF32-V;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF8-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1/UniKS-UTF8-V")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-Korea1" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-0"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-CID"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-Host"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-H-Mac"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-KSCms-UHC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-KSCpc-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/Adobe-Korea1-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-Johab-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-Johab-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-HW-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-HW-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCms-UHC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-UCS2C"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSCpc-EUC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/KSC-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UCS2-KSCms-UHC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UCS2-KSCpc-EUC"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UCS2-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UCS2-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF16-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF32-V"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF8-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-Korea1/UniKS-UTF8-V"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-0;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-1;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-3;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-4;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-5;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-6;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-7;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-8;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-9;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/Adobe-KR-UCS2;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/UniAKR-UTF16-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/UniAKR-UTF32-H;C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR/UniAKR-UTF8-H")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cMap/Adobe-KR" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-0"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-3"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-4"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-5"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-6"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-7"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-8"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-9"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/Adobe-KR-UCS2"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/UniAKR-UTF16-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/UniAKR-UTF32-H"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cMap/Adobe-KR/UniAKR-UTF8-H"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/nameToUnicode/Bulgarian;C:/Program Files (x86)/poppler-data/share/poppler/nameToUnicode/Greek;C:/Program Files (x86)/poppler-data/share/poppler/nameToUnicode/Thai")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/nameToUnicode" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/nameToUnicode/Bulgarian"
    "C:/my-note-app/poppler-25.12.0/share/poppler/nameToUnicode/Greek"
    "C:/my-note-app/poppler-25.12.0/share/poppler/nameToUnicode/Thai"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/poppler/cidToUnicode/Adobe-GB1;C:/Program Files (x86)/poppler-data/share/poppler/cidToUnicode/Adobe-CNS1;C:/Program Files (x86)/poppler-data/share/poppler/cidToUnicode/Adobe-Japan1;C:/Program Files (x86)/poppler-data/share/poppler/cidToUnicode/Adobe-Korea1")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/poppler/cidToUnicode" TYPE FILE FILES
    "C:/my-note-app/poppler-25.12.0/share/poppler/cidToUnicode/Adobe-GB1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cidToUnicode/Adobe-CNS1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cidToUnicode/Adobe-Japan1"
    "C:/my-note-app/poppler-25.12.0/share/poppler/cidToUnicode/Adobe-Korea1"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  list(APPEND CMAKE_ABSOLUTE_DESTINATION_FILES
   "C:/Program Files (x86)/poppler-data/share/pkgconfig/poppler-data.pc")
  if(CMAKE_WARN_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(WARNING "ABSOLUTE path INSTALL DESTINATION : ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
  if(CMAKE_ERROR_ON_ABSOLUTE_INSTALL_DESTINATION)
    message(FATAL_ERROR "ABSOLUTE path INSTALL DESTINATION forbidden (by caller): ${CMAKE_ABSOLUTE_DESTINATION_FILES}")
  endif()
file(INSTALL DESTINATION "C:/Program Files (x86)/poppler-data/share/pkgconfig" TYPE FILE FILES "C:/my-note-app/build/poppler-data.pc")
endif()

if(CMAKE_INSTALL_COMPONENT)
  set(CMAKE_INSTALL_MANIFEST "install_manifest_${CMAKE_INSTALL_COMPONENT}.txt")
else()
  set(CMAKE_INSTALL_MANIFEST "install_manifest.txt")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
file(WRITE "C:/my-note-app/build/${CMAKE_INSTALL_MANIFEST}"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
