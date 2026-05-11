package com.rms.common.serviceImplement;

import com.rms.common.entities.MessageApprovalEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface MessageApprovalServiceIMP {
    // Get All Record MessageApprovals 
    public List<MessageApprovalEntity> getAllRecordMessageApproval(String token) throws Exception;

    // Get All MessageApprovals in Pagination
    public Map<String, Object> getAllMessageApproval(Integer pageNumber, Integer pageSize, String token) throws Exception;

    // Get Single MessageApproval By Id
    public MessageApprovalEntity getOneMessageApproval(Long id, String token) throws Exception;

    // Add/Create New MessageApproval
    public String addMessageApproval(MessageApprovalEntity message_approvalEntity, String token) throws Exception;

    // Update Existing MessageApproval
    public String updateMessageApproval(MessageApprovalEntity message_approvalEntity,String token)throws Exception;

    // Delete MessageApproval By Id
    public String deleteMessageApproval(Long id, String token) throws Exception;

    // Add Multiple MessageApproval
    public String addMultipleMessageApproval(List<MessageApprovalEntity> message_approvalEntity, String token) throws Exception;

    // Generate XL File 
    ByteArrayInputStream streamExcel(int pageNumber, int pageSize,String token) throws IOException;

}
