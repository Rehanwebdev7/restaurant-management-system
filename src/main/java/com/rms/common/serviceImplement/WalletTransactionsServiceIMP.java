package com.rms.common.serviceImplement;

import com.rms.common.entities.WalletTransactionsEntity;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WalletTransactionsServiceIMP {
    List<WalletTransactionsEntity> getAllRecordWalletTransactions(String token) throws Exception;

    Map<String, Object> getAllWalletTransactions(Integer pageNumber, Integer pageSize, String token) throws Exception;

    WalletTransactionsEntity getOneWalletTransactions(Integer id, String token) throws Exception;

    String addWalletTransactions(WalletTransactionsEntity walletTransactionsEntity, String token) throws Exception;

    String updateWalletTransactions(WalletTransactionsEntity walletTransactionsEntity, String token) throws Exception;

    String deleteWalletTransactions(Integer id, String token) throws Exception;

    String addMultipleWalletTransactions(List<WalletTransactionsEntity> walletTransactionsEntities, String token) throws Exception;

    ByteArrayInputStream streamExcel(int pageNumber, int pageSize, String token) throws IOException;

    List<WalletTransactionsEntity> getWalletTransactionsByDate(LocalDate date, String token) throws Exception;

    List<WalletTransactionsEntity> getWalletTransactionsByDateBetween(LocalDate fromDate, LocalDate toDate,
                                                                      String token) throws Exception;

    Map<String, Object> getWalletTransactionsByDateBetweenPagination(LocalDate fromDate, LocalDate toDate,
                                                                     Integer pageNumber, Integer pageSize,
                                                                     String token) throws Exception;
}
