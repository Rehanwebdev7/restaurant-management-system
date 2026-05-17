package com.rms.common.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.rms.common.entities.DiningTablesEntity;
import com.rms.common.repositories.DiningTablesRepository;

@Component
public class DiningTableReleaseScheduler {

    private final DiningTablesRepository diningTablesRepository;
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "dining-table-release");
        thread.setDaemon(true);
        return thread;
    });
    private final Map<Long, ScheduledFuture<?>> pendingReleases = new ConcurrentHashMap<>();

    public DiningTableReleaseScheduler(DiningTablesRepository diningTablesRepository) {
        this.diningTablesRepository = diningTablesRepository;
    }

    public void scheduleRelease(Long tableId) {
        if (tableId == null) {
            return;
        }

        ScheduledFuture<?> existing = pendingReleases.remove(tableId);
        if (existing != null) {
            existing.cancel(false);
        }

        ScheduledFuture<?> future = executor.schedule(() -> {
            try {
                setStatus(tableId, 1);
            } finally {
                pendingReleases.remove(tableId);
            }
        }, 5, TimeUnit.MINUTES);

        pendingReleases.put(tableId, future);
    }

    @Transactional
    public void setStatus(Long tableId, int status) {
        diningTablesRepository.findById(tableId).ifPresent(table -> {
            table.setStatus(status);
            diningTablesRepository.save(table);
        });
    }
}
