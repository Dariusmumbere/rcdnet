// Add this to your existing FastAPI backend code

@app.post("/donations/with-stats/", response_model=Donation)
def create_donation_with_stats(donation: DonationCreate):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # First, get or create the donor
        cursor.execute('''
            SELECT id FROM donors WHERE name = %s
        ''', (donation.donor_name,))
        donor = cursor.fetchone()
        
        donor_id = None
        if donor:
            donor_id = donor[0]
        else:
            # Create a new donor if not exists
            cursor.execute('''
                INSERT INTO donors (name, donor_type, category)
                VALUES (%s, 'individual', 'one-time')
                RETURNING id
            ''', (donation.donor_name,))
            donor_id = cursor.fetchone()[0]
        
        # Insert donation with donor_id
        cursor.execute('''
            INSERT INTO donations (donor_id, donor_name, amount, payment_method, date, project, notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'completed')
            RETURNING id, donor_name, amount, payment_method, date, project, notes, status, created_at
        ''', (
            donor_id,
            donation.donor_name,
            donation.amount,
            donation.payment_method,
            donation.date,
            donation.project,
            donation.notes
        ))
        
        new_donation = cursor.fetchone()
        
        # Update donor statistics
        cursor.execute('''
            UPDATE donors
            SET 
                stats = jsonb_build_object(
                    'donation_count', COALESCE((SELECT COUNT(*) FROM donations WHERE donor_id = donors.id), 0),
                    'total_donated', COALESCE((SELECT SUM(amount) FROM donations WHERE donor_id = donors.id), 0),
                    'first_donation', (SELECT MIN(date) FROM donations WHERE donor_id = donors.id),
                    'last_donation', (SELECT MAX(date) FROM donations WHERE donor_id = donors.id)
                )
            WHERE id = %s
        ''', (donor_id,))
        
        # Update the appropriate program area balance if project is specified
        if donation.project:
            cursor.execute('''
                UPDATE program_areas
                SET balance = balance + %s
                WHERE name = %s
                RETURNING balance
            ''', (donation.amount, donation.project))
            
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"Program area '{donation.project}' not found")
        
        # Update main account balance
        cursor.execute('''
            UPDATE bank_accounts
            SET balance = balance + %s
            WHERE name = 'Main Account'
            RETURNING balance
        ''', (donation.amount,))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=500, detail="Main account not found")
        
        conn.commit()
        
        return {
            "id": new_donation[0],
            "donor_name": new_donation[1],
            "amount": new_donation[2],
            "payment_method": new_donation[3],
            "date": new_donation[4],
            "project": new_donation[5],
            "notes": new_donation[6],
            "status": new_donation[7],
            "created_at": new_donation[8]
        }
    except Exception as e:
        logger.error(f"Error creating donation with stats: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

# Update the Donor model to include stats
class Donor(BaseModel):
    id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    donor_type: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = "one-time"
    created_at: Optional[datetime] = None
    stats: Optional[Dict] = None  # Changed from DonorStats to Dict for flexibility

# Update the donor retrieval endpoint to include stats
@app.get("/donors/{donor_id}", response_model=Donor)
def get_donor(donor_id: int):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get donor basic info
        cursor.execute('''
            SELECT id, name, email, phone, address, donor_type, notes, category, created_at
            FROM donors
            WHERE id = %s
        ''', (donor_id,))
        
        donor = cursor.fetchone()
        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")
            
        # Get donor statistics from the stats JSON column
        cursor.execute('''
            SELECT stats FROM donors WHERE id = %s
        ''', (donor_id,))
        
        stats = cursor.fetchone()[0] or {
            "donation_count": 0,
            "total_donated": 0,
            "first_donation": None,
            "last_donation": None
        }
        
        return {
            "id": donor[0],
            "name": donor[1],
            "email": donor[2],
            "phone": donor[3],
            "address": donor[4],
            "donor_type": donor[5],
            "notes": donor[6],
            "category": donor[7],
            "created_at": donor[8],
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error fetching donor: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch donor")
    finally:
        if conn:
            conn.close()
