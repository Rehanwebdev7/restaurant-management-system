package com.rms.common.serviceImplement;

import com.rms.common.entities.GlobalSettingEntity;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface GlobalSettingServiceIMP {
    List<GlobalSettingEntity> getAllRecordGlobalSetting(String token) throws Exception;
    Map<String, Object> getAllGlobalSetting(Integer pageNumber, Integer pageSize, String token) throws Exception;
    GlobalSettingEntity getOneGlobalSetting(Long id, String token) throws Exception;
    String addGlobalSetting(GlobalSettingEntity global_settingEntity, String token) throws Exception;
    String updateGlobalSetting(GlobalSettingEntity global_settingEntity, String token) throws Exception;
    String deleteGlobalSetting(Long id, String token) throws Exception;
    String addMultipleGlobalSetting(List<GlobalSettingEntity> global_settingEntitys, String token) throws Exception;
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException;
}
