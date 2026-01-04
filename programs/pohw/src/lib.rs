use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYpD5p9Q2X6Kz8Y6rZ9i6s"); 

#[program]
pub mod proof_of_human {
    use super::*;

    pub fn create_paid_task(
        ctx: Context<CreatePaidTask>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.organiser = ctx.accounts.organiser.key();
        escrow.amount = amount;
        escrow.is_released = false;

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.organiser.key(),
            &escrow.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.organiser.to_account_info(),
                escrow.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.is_released, EscrowError::AlreadyReleased);

        escrow.is_released = true;

        **escrow.to_account_info().try_borrow_mut_lamports()? -= escrow.amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += escrow.amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePaidTask<'info> {
    #[account(
        init,
        payer = organiser,
        seeds = [b"escrow", organiser.key().as_ref()],
        bump,
        space = 8 + 32 + 8 + 1
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub organiser: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
}

#[account]
pub struct EscrowAccount {
    pub organiser: Pubkey,
    pub amount: u64,
    pub is_released: bool,
}

#[error_code]
pub enum EscrowError {
    #[msg("Already released")]
    AlreadyReleased,
}
